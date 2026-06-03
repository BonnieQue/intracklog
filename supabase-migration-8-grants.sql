-- InTrackLog Migration 8: explicit Data API grants
-- Run this in your Supabase SQL Editor.
--
-- Why: from 30 May 2026 new Supabase projects no longer auto-expose public
-- tables to the Data API (PostgREST / supabase-js); existing projects enforce
-- this on new tables from 30 Oct 2026. A table needs a role GRANT to be
-- reachable at all — RLS only controls WHICH ROWS, not whether the table is
-- exposed. This migration makes our access explicit so it works on this
-- project AND on any brand-new project we stand up for production.
--
-- Safe + idempotent: re-granting is harmless. RLS policies still apply on top.

-- ── App tables: full access for signed-in users (rows still gated by RLS) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.vehicles,
  public.entries,
  public.attachments,
  public.saved_locations,
  public.teams,
  public.team_members,
  public.team_invites,
  public.user_settings,
  public.reimbursement_reports
TO authenticated;

-- ── Anonymous: only the invite-by-token read (matches the existing
--    "Public can view by token" policy on team_invites). Remove if invite
--    acceptance always happens while logged in. ──
GRANT SELECT ON public.team_invites TO anon;

-- ── service_role bypasses RLS and is used by server-side / Edge Functions
--    (e.g. the planned PayFast IPN webhook). Granting keeps it working on a
--    fresh project too. ──
GRANT ALL ON
  public.vehicles,
  public.entries,
  public.attachments,
  public.saved_locations,
  public.teams,
  public.team_members,
  public.team_invites,
  public.user_settings,
  public.reimbursement_reports
TO service_role;
