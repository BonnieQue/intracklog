-- InTrackLog Migration 10: accept_team_invite() helper
-- Run this in your Supabase SQL Editor.
--
-- The app's "Send invite" creates a row in team_invites with a unique token.
-- This function is what the /accept-invite page calls to consume that token
-- safely: it checks the invite is pending, that the signed-in user's email
-- matches the invited email, marks the invite accepted, and (idempotently)
-- ensures a team_members row exists linking the user to the team. Runs as
-- SECURITY DEFINER so the client doesn't need to mutate team_members directly.

CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite     RECORD;
  v_user_id    UUID := auth.uid();
  v_user_email TEXT;
  v_full_name  TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_invite FROM team_invites WHERE invite_token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invite_not_found');
  END IF;

  IF v_invite.status <> 'pending' THEN
    RETURN json_build_object('ok', false, 'error', 'invite_' || v_invite.status);
  END IF;

  SELECT email,
         COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
    INTO v_user_email, v_full_name
    FROM auth.users WHERE id = v_user_id;

  IF LOWER(v_user_email) <> LOWER(v_invite.email) THEN
    RETURN json_build_object('ok', false, 'error', 'email_mismatch');
  END IF;

  UPDATE team_invites
     SET status = 'accepted', responded_at = now()
   WHERE id = v_invite.id;

  -- Ensure a member row exists linking this user (idempotent).
  INSERT INTO team_members (team_id, user_id, name, email, role)
  VALUES (v_invite.team_id, v_user_id, v_full_name, v_user_email, 'member')
  ON CONFLICT DO NOTHING;

  -- If an admin previously added the same email with no user_id, link it.
  UPDATE team_members
     SET user_id = v_user_id
   WHERE team_id = v_invite.team_id
     AND LOWER(email) = LOWER(v_user_email)
     AND user_id IS NULL;

  RETURN json_build_object('ok', true, 'team_id', v_invite.team_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invite(UUID) TO authenticated;
