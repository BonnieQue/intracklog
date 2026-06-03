-- InTrackLog Migration 7: reimbursement reports (employee submit -> admin approve)
-- Run this in your Supabase SQL Editor.
--
-- A member submits a period's business mileage to a team; a team admin (the
-- owner, or a member with role='admin') approves/rejects and marks paid.
-- Amounts are snapshotted at submission so an approved record never shifts.

-- ──────────────────────────────────────────────
-- 1. Helper: is this user an admin of the team? (owner OR admin member)
--    SECURITY DEFINER bypasses RLS so policies don't recurse (see migration 4).
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_team_admin(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM teams WHERE id = team_uuid AND owner_id = user_uuid)
      OR EXISTS (SELECT 1 FROM team_members WHERE team_id = team_uuid AND user_id = user_uuid AND role = 'admin');
$$;

-- ──────────────────────────────────────────────
-- 2. Table
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reimbursement_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submitter_name TEXT,
  period_label TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  business_km DECIMAL(10,1) NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  note TEXT,
  reviewer_note TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- ──────────────────────────────────────────────
-- 3. RLS
-- ──────────────────────────────────────────────
ALTER TABLE reimbursement_reports ENABLE ROW LEVEL SECURITY;

-- Submitter sees their own; team admins see all for their team.
CREATE POLICY "View own or team reimbursements" ON reimbursement_reports
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_team_admin(team_id, auth.uid())
  );

-- A member submits only their own report, only to a team they belong to.
CREATE POLICY "Members submit own reimbursements" ON reimbursement_reports
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (public.is_team_member(team_id, auth.uid()) OR public.is_team_admin(team_id, auth.uid()))
  );

-- Team admins approve/reject/mark paid.
CREATE POLICY "Admins update team reimbursements" ON reimbursement_reports
  FOR UPDATE USING (public.is_team_admin(team_id, auth.uid()));

-- Submitter can withdraw their own.
CREATE POLICY "Members delete own reimbursements" ON reimbursement_reports
  FOR DELETE USING (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 4. Indexes
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reimbursement_team ON reimbursement_reports(team_id, status);
CREATE INDEX IF NOT EXISTS idx_reimbursement_user ON reimbursement_reports(user_id);
