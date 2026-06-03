-- InTrackLog Migration 2: Teams, Locations, Settings, Invitations
-- Run this in your Supabase SQL Editor

-- ──────────────────────────────────────────────
-- STEP 1: Create all tables first (no policies yet)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  workplace TEXT NOT NULL,
  workplace_address TEXT,
  rate_type TEXT DEFAULT 'standard',
  custom_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  invite_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  mileage_rate DECIMAL(10,2) DEFAULT 4.64,
  workplace_name TEXT,
  workplace_address TEXT,
  employee_number TEXT,
  subscription_tier TEXT DEFAULT 'free',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- STEP 2: Enable Row Level Security on all tables
-- ──────────────────────────────────────────────

ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- STEP 3: Add policies (now that all tables exist)
-- ──────────────────────────────────────────────

-- Saved locations
CREATE POLICY "Users can view own locations" ON saved_locations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own locations" ON saved_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON saved_locations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON saved_locations
  FOR DELETE USING (auth.uid() = user_id);

-- Teams
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    auth.uid() = owner_id OR
    auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = teams.id)
  );
CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update teams" ON teams
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete teams" ON teams
  FOR DELETE USING (auth.uid() = owner_id);

-- Team members
CREATE POLICY "Members can view their team's members" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()) OR
    user_id = auth.uid()
  );
CREATE POLICY "Team owners can manage members" ON team_members
  FOR ALL USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- Team invites
CREATE POLICY "Team owners can view their invites" ON team_invites
  FOR SELECT USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));
CREATE POLICY "Team owners can create invites" ON team_invites
  FOR INSERT WITH CHECK (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));
CREATE POLICY "Team owners can update invites" ON team_invites
  FOR UPDATE USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));
CREATE POLICY "Team owners can delete invites" ON team_invites
  FOR DELETE USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));
CREATE POLICY "Public can view by token" ON team_invites
  FOR SELECT USING (true);

-- User settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- STEP 4: Auto-create user_settings row for new signups
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- ──────────────────────────────────────────────
-- STEP 5: Performance indexes
-- ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_saved_locations_user ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
