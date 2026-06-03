-- InTrackLog Migration 4: Fix infinite-recursion bug in teams / team_members RLS
-- Run this in your Supabase SQL Editor.
--
-- Background: the original policies in migration 2 had `teams` referencing
-- `team_members` and `team_members` referencing `teams`. Postgres recurses
-- on these mutually-recursive policies and throws
-- `infinite recursion detected in policy for relation "teams"` whenever
-- a non-owner is involved or the planner evaluates both OR branches.
--
-- This migration replaces the recursive subquery in the teams policy with a
-- SECURITY DEFINER function (which bypasses RLS) so the recursion never starts.

-- ──────────────────────────────────────────────
-- 1. Drop the recursive policies
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Members can view their team's members" ON team_members;

-- ──────────────────────────────────────────────
-- 2. Helper function — bypasses RLS, only checks if a user is in a team
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
$$;

-- ──────────────────────────────────────────────
-- 3. Recreate teams SELECT — no longer recurses
-- ──────────────────────────────────────────────

CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    auth.uid() = owner_id
    OR public.is_team_member(id, auth.uid())
  );

-- ──────────────────────────────────────────────
-- 4. Recreate team_members SELECT — owner branch goes through teams which
-- now uses the SECURITY DEFINER function, so no recursion.
-- ──────────────────────────────────────────────

CREATE POLICY "Members can view their team's members" ON team_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

-- ──────────────────────────────────────────────
-- 5. Tighten user_settings — prevent client-side self-promotion of tier
-- (Optional but recommended — see comments in dashboard about Driversnote
-- pattern. The PayFast IPN webhook should be the only thing that mutates
-- subscription_tier, using the service-role key.)
--
-- Leave commented-out for now; uncomment once your PayFast IPN function
-- is deployed and writing tier updates via service-role key.
-- ──────────────────────────────────────────────

-- DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
-- CREATE POLICY "Users can update own settings (except tier)" ON user_settings
--   FOR UPDATE USING (auth.uid() = user_id)
--   WITH CHECK (
--     auth.uid() = user_id
--     AND subscription_tier IS NOT DISTINCT FROM (
--       SELECT subscription_tier FROM user_settings WHERE user_id = auth.uid()
--     )
--   );
