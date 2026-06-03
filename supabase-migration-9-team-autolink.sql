-- InTrackLog Migration 9: auto-link team members to their auth user by email
-- Run this in your Supabase SQL Editor.
--
-- Problem this fixes: an admin's "Add member" form inserts into team_members
-- with (name, email, role) and no user_id. Team RLS requires
-- user_id = auth.uid() (via is_team_member), so the added person never sees
-- the team — even though they're listed under it. The intended invite-email +
-- accept flow currently has two gaps (no email being sent; no accept-invite
-- page), so we link by email directly: instantly if the user already exists,
-- and at signup time if they don't.

-- ──────────────────────────────────────────────
-- 1. On team_members INSERT/UPDATE: resolve email -> user_id if missing
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.link_team_member_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    NEW.user_id := (
      SELECT id FROM auth.users
      WHERE LOWER(email) = LOWER(NEW.email)
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_members_autolink ON public.team_members;
CREATE TRIGGER team_members_autolink
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.link_team_member_to_user();

-- ──────────────────────────────────────────────
-- 2. On auth.users INSERT: backfill any pending team_members rows for that
--    email (covers "add member before they sign up")
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.link_pending_team_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.team_members
  SET user_id = NEW.id
  WHERE user_id IS NULL
    AND LOWER(email) = LOWER(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_members ON auth.users;
CREATE TRIGGER on_auth_user_created_link_members
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_pending_team_members();

-- ──────────────────────────────────────────────
-- 3. One-off backfill for rows added before this migration
--    (this links the sales-team tester immediately on run)
-- ──────────────────────────────────────────────
UPDATE public.team_members tm
SET user_id = u.id
FROM auth.users u
WHERE tm.user_id IS NULL
  AND LOWER(tm.email) = LOWER(u.email);
