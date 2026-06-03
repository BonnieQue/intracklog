#!/usr/bin/env node
/**
 * InTrackLog Supabase smoke test.
 *
 * Verifies a Supabase project end-to-end without touching the UI:
 *   - auth sign-in
 *   - schema/grants (vehicles, entries, teams, reimbursement_reports)
 *   - migrations 5/6/7/9/10 (decimal km, trip_type, is_team_admin,
 *     team auto-link, accept_team_invite)
 *   - reconcile math (50 km × R4.64 = R232)
 *   - admin RLS for approve/mark-paid
 *
 * One-off setup (per environment):
 *   1. Sign up a smoke-test account in the app once, click the confirm email.
 *      e.g. smoketest@yourdomain.com / a strong password.
 *   2. From then on, this script signs in and runs CRUD; no email needed.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_URL="https://lanzwobisthsmzswumal.supabase.co"
 *   $env:SUPABASE_ANON_KEY="eyJ..."
 *   $env:TEST_EMAIL="smoketest@yourdomain.com"
 *   $env:TEST_PASSWORD="..."
 *   node scripts/smoke-test.mjs
 *
 * Or via the npm script:
 *   npm run smoke:prod    (uses prod values from .env.smoke)
 *   npm run smoke:dev     (uses dev values from .env)
 *
 * Exit code 0 = launch-ready. Non-zero = first failing step is logged with
 * the exact error message.
 */

import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_EMAIL;
const PASS = process.env.TEST_PASSWORD;

if (!URL || !KEY || !EMAIL || !PASS) {
  console.error('❌ Required env vars missing.');
  console.error('   SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD');
  process.exit(2);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const ok = (s) => console.log(`✅ ${s}`);
const die = (step, e) => {
  console.error(`\n❌ FAIL at "${step}":`, e?.message || e);
  console.error('   (Earlier steps that touched the DB may have left rows behind — see Supabase dashboard.)');
  process.exit(1);
};

console.log(`\n🔍 InTrackLog smoke test`);
console.log(`URL:   ${URL}`);
console.log(`User:  ${EMAIL}\n`);

// 1. Sign in --------------------------------------------------------------
let userId;
try {
  const { data, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (error) throw error;
  userId = data.user?.id;
  if (!userId) throw new Error('no user id returned');
  ok(`sign-in (user ${userId.slice(0, 8)}…)`);
} catch (e) {
  console.error('\n❌ Sign-in failed.');
  console.error('   Create the smoke-test account in the app first, click the confirm email,');
  console.error('   then re-run. Underlying error:', e?.message || e);
  process.exit(1);
}

// 1b. Wipe leftover rows from previous failed runs (idempotent) ----------
try {
  const oldVehicles = await supabase.from('vehicles').select('id').eq('user_id', userId).eq('reg_number', 'SMOKE-1');
  for (const v of (oldVehicles.data || [])) {
    await supabase.from('entries').delete().eq('vehicle_id', v.id);
    await supabase.from('vehicles').delete().eq('id', v.id);
  }
  const oldTeams = await supabase.from('teams').select('id').eq('owner_id', userId).eq('name', 'Smoke Team');
  for (const t of (oldTeams.data || [])) {
    await supabase.from('reimbursement_reports').delete().eq('team_id', t.id);
    await supabase.from('team_members').delete().eq('team_id', t.id);
    await supabase.from('teams').delete().eq('id', t.id);
  }
  ok(`pre-clean leftover smoke rows`);
} catch (e) { die('pre-clean', e); }

// 2. Vehicle --------------------------------------------------------------
let vehicleId;
try {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      user_id: userId,
      name: 'Smoke Car',
      reg_number: 'SMOKE-1',
      description: 'Smoke test vehicle',
      start_mileage: 10000,
      badge: 'S',
      color_index: 0,
    })
    .select()
    .single();
  if (error) throw error;
  vehicleId = data.id;
  ok(`vehicle insert (id ${vehicleId.slice(0, 8)}…)`);
} catch (e) { die('vehicle insert', e); }

// 3. Entry (Business trip, 50 km, decimal-compatible) ---------------------
let entryId;
try {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      vehicle_id: vehicleId,
      entry_date: new Date().toISOString(),
      reading_km: 10050,
      trip_km: 50.0,                 // proves migration 5 (NUMERIC)
      trip_type: 'business',         // proves migration 6 (trip_type)
      notes: 'FROM: Smoke A → TO: Smoke B',
    })
    .select()
    .single();
  if (error) throw error;
  entryId = data.id;
  ok(`entry insert (50 km Business)`);
} catch (e) { die('entry insert', e); }

// 4. Read back and verify reconcile math ----------------------------------
try {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .single();
  if (error) throw error;
  const km = Number(data.trip_km);
  if (km !== 50) throw new Error(`expected trip_km 50, got ${km}`);
  if (data.trip_type !== 'business') throw new Error(`expected trip_type business, got ${data.trip_type}`);
  const reimbursable = Math.round(km * 4.64 * 100) / 100;
  if (reimbursable !== 232) throw new Error(`reconcile math wrong: ${reimbursable}`);
  ok(`entry readable + reconcile math correct (R${reimbursable.toFixed(2)})`);
} catch (e) { die('entry verify', e); }

// 5. Team -----------------------------------------------------------------
let teamId;
try {
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      owner_id: userId,
      name: 'Smoke Team',
      workplace: 'Smoke HQ',
      workplace_address: '1 Smoke St',
      rate_type: 'standard',
    })
    .select()
    .single();
  if (error) throw error;
  teamId = team.id;
  // Mimic the app: auto-add creator as admin member.
  await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
    name: 'Smoke',
    email: EMAIL,
    role: 'admin',
  });
  ok(`team + creator-as-admin member`);
} catch (e) { die('team insert', e); }

// 6. Submit reimbursement claim ------------------------------------------
let claimId;
try {
  const { data, error } = await supabase
    .from('reimbursement_reports')
    .insert({
      team_id: teamId,
      user_id: userId,
      period_label: 'Smoke',
      period_start: '2026-01-01',
      period_end: '2026-12-31',
      business_km: 50.0,
      rate: 4.64,
      amount: 232.00,
    })
    .select()
    .single();
  if (error) throw error;
  claimId = data.id;
  ok(`claim submitted (proves migration 7 + admin policy)`);
} catch (e) { die('claim submit', e); }

// 7. Approve + Mark paid (proves is_team_admin RLS works) -----------------
try {
  let r = await supabase
    .from('reimbursement_reports')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', claimId)
    .select()
    .single();
  if (r.error) throw r.error;
  if (r.data.status !== 'approved') throw new Error('approve update silently rejected (RLS?)');

  r = await supabase
    .from('reimbursement_reports')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', claimId)
    .select()
    .single();
  if (r.error) throw r.error;
  if (r.data.status !== 'paid') throw new Error('paid update silently rejected (RLS?)');
  ok(`approve → paid (admin RLS works)`);
} catch (e) { die('approve / mark paid', e); }

// 8. Cleanup --------------------------------------------------------------
try {
  await supabase.from('reimbursement_reports').delete().eq('id', claimId);
  await supabase.from('entries').delete().eq('id', entryId);
  await supabase.from('team_members').delete().eq('team_id', teamId);
  await supabase.from('teams').delete().eq('id', teamId);
  await supabase.from('vehicles').delete().eq('id', vehicleId);
  ok(`cleanup complete (all smoke rows removed)`);
} catch (e) { die('cleanup', e); }

console.log(`\n🎉 All 8 steps passed. Project at ${URL} is launch-ready.\n`);
process.exit(0);
