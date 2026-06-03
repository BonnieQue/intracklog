import { supabase } from './supabase';

// ── Auth ──────────────────────────────────────────────

export async function apiRegister(fullName: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: 'https://intracklog.com',
    },
  });
  if (error) throw new Error(error.message);
  // When email confirmation is on, data.session is null until the user clicks the link.
  return data;
}

export async function apiLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function apiGetMe() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error(error?.message || 'Not authenticated');
  return {
    id: user.id,
    full_name: user.user_metadata?.full_name || '',
    email: user.email || '',
  };
}

export async function apiLogout() {
  await supabase.auth.signOut();
}

// ── Vehicles ──────────────────────────────────────────

export interface VehicleResponse {
  id: string; name: string; reg_number: string | null; licence_plate: string | null; description: string | null;
  start_mileage: number | null; color_index: number; badge: string; created_at: string;
}

export async function apiListVehicles(): Promise<VehicleResponse[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiCreateVehicle(vehicle: { name: string; reg_number?: string; licence_plate?: string; description?: string; start_mileage?: number }): Promise<VehicleResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const badge = vehicle.name.charAt(0).toUpperCase();
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ user_id: user.id, name: vehicle.name, reg_number: vehicle.licence_plate || vehicle.reg_number || null, description: vehicle.description || null, start_mileage: vehicle.start_mileage || null, badge, color_index: 0 })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiUpdateVehicle(id: string, updates: Partial<{ name: string; reg_number: string; licence_plate: string; description: string; start_mileage: number }>): Promise<VehicleResponse> {
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Entries ───────────────────────────────────────────

export interface AttachmentResponse { id: string; file_name: string; file_type: string; uri: string; created_at: string; }
export interface EntryResponse {
  id: string; vehicle_id: string; entry_date: string; reading_km: number | null;
  trip_km: number | null; expense_type: string | null; amount: number | null;
  notes: string | null; attachments: AttachmentResponse[]; created_at: string;
}

// Postgres NUMERIC/DECIMAL columns (trip_km, amount) come back as strings over
// the wire — coerce them to real numbers so downstream arithmetic is safe.
function normalizeEntry(e: any): EntryResponse {
  return {
    ...e,
    reading_km: e.reading_km != null ? Number(e.reading_km) : null,
    trip_km: e.trip_km != null ? Number(e.trip_km) : null,
    amount: e.amount != null ? Number(e.amount) : null,
    attachments: e.attachments || [],
  };
}

export async function apiListEntries(vehicleId: string, dateFrom?: string, dateTo?: string): Promise<EntryResponse[]> {
  let query = supabase
    .from('entries')
    .select('*, attachments(*)')
    .eq('vehicle_id', vehicleId)
    .order('entry_date', { ascending: false });
  if (dateFrom) query = query.gte('entry_date', dateFrom);
  if (dateTo) query = query.lte('entry_date', dateTo);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(normalizeEntry);
}

export async function apiCreateEntry(vehicleId: string, entry: { entry_date: string; reading_km?: number; trip_km?: number; expense_type?: string; amount?: number; notes?: string; trip_type?: 'business' | 'personal' | null }): Promise<EntryResponse> {
  const { data, error } = await supabase
    .from('entries')
    .insert({ ...entry, vehicle_id: vehicleId })
    .select('*, attachments(*)')
    .single();
  if (error) throw new Error(error.message);
  return normalizeEntry(data);
}

export async function apiUpdateEntry(entryId: string, updates: Partial<{ entry_date: string; reading_km: number; trip_km: number; expense_type: string; amount: number; notes: string }>): Promise<EntryResponse> {
  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', entryId)
    .select('*, attachments(*)')
    .single();
  if (error) throw new Error(error.message);
  return normalizeEntry(data);
}

export async function apiDeleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', entryId);
  if (error) throw new Error(error.message);
}

// ── Attachments ───────────────────────────────────────

export async function apiUploadAttachment(entryId: string, file: { uri: string; name: string; type: string }): Promise<AttachmentResponse> {
  const filePath = `${entryId}/${Date.now()}_${file.name}`;
  const response = await fetch(file.uri);
  const blob = await response.blob();
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, blob, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('attachments')
    .insert({ entry_id: entryId, file_name: file.name, file_type: file.type, uri: urlData.publicUrl })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteAttachment(attachmentId: string): Promise<void> {
  const { error } = await supabase.from('attachments').delete().eq('id', attachmentId);
  if (error) throw new Error(error.message);
}

export function attachmentUrl(uri: string): string {
  return uri;
}

// ── Saved Locations ───────────────────────────

export interface SavedLocationResponse {
  id: string; name: string; address: string | null; city: string | null; country: string | null; created_at: string;
}

export async function apiListLocations(): Promise<SavedLocationResponse[]> {
  const { data, error } = await supabase.from('saved_locations').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiCreateLocation(loc: { name: string; address?: string; city?: string; country?: string }): Promise<SavedLocationResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('saved_locations')
    .insert({ ...loc, user_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiDeleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from('saved_locations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Teams ─────────────────────────────────────

export interface TeamMemberResponse {
  id: string; team_id: string; user_id: string | null; name: string; email: string; role: 'admin' | 'member'; joined_at: string;
}

export interface TeamResponse {
  id: string; owner_id: string; name: string; workplace: string; workplace_address: string | null;
  rate_type: string; custom_rate: number | null; created_at: string;
}

export interface TeamInviteResponse {
  id: string; team_id: string; email: string; invited_by: string; status: string; invite_token: string; sent_at: string;
}

export async function apiListTeams(): Promise<TeamResponse[]> {
  const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiCreateTeam(team: { name: string; workplace: string; workplace_address?: string; rate_type?: string; custom_rate?: number }): Promise<TeamResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('teams')
    .insert({ ...team, owner_id: user.id }).select().single();
  if (error) throw new Error(error.message);
  // Auto-add the creator as an admin member
  await supabase.from('team_members').insert({
    team_id: data.id,
    user_id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
    email: user.email || '',
    role: 'admin',
  });
  return data;
}

export async function apiDeleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function apiListTeamMembers(teamId: string): Promise<TeamMemberResponse[]> {
  const { data, error } = await supabase.from('team_members').select('*').eq('team_id', teamId).order('joined_at');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiAddTeamMember(teamId: string, member: { name: string; email: string; role: 'admin' | 'member' }): Promise<TeamMemberResponse> {
  const { data, error } = await supabase.from('team_members')
    .insert({ team_id: teamId, ...member }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiRemoveTeamMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', memberId);
  if (error) throw new Error(error.message);
}

// ── Team Invitations ──────────────────────────

export async function apiListTeamInvites(teamId: string): Promise<TeamInviteResponse[]> {
  const { data, error } = await supabase.from('team_invites')
    .select('*').eq('team_id', teamId).eq('status', 'pending')
    .order('sent_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function apiSendTeamInvite(teamId: string, email: string): Promise<TeamInviteResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('team_invites')
    .insert({ team_id: teamId, email, invited_by: user.id }).select().single();
  if (error) throw new Error(error.message);

  // Best-effort: ask the send-team-invite Edge Function to email the recipient.
  // If the function isn't deployed (or Resend isn't configured) we swallow the
  // error — the admin can still hit "Share link" on the pending row.
  try {
    const team = await supabase.from('teams').select('name').eq('id', teamId).maybeSingle();
    await supabase.functions.invoke('send-team-invite', {
      body: {
        invite_id: data.id,
        team_name: team.data?.name || 'a team',
        inviter_name: user.user_metadata?.full_name || user.email,
        recipient_email: email,
        accept_url: `https://intracklog.com/accept-invite?token=${data.invite_token}`,
      },
    });
  } catch { /* ignore — fallback is the Share link */ }

  return data;
}

export async function apiCancelTeamInvite(id: string): Promise<void> {
  const { error } = await supabase.from('team_invites').update({ status: 'cancelled', responded_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

// Public read by token (the "Public can view by token" RLS policy permits anon).
export interface InviteByTokenResponse extends TeamInviteResponse {
  team_name: string;
  team_workplace: string;
}

export async function apiGetInviteByToken(token: string): Promise<InviteByTokenResponse | null> {
  const { data, error } = await supabase
    .from('team_invites')
    .select('*, teams(name, workplace)')
    .eq('invite_token', token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const t = (data as any).teams || {};
  return { ...(data as any), team_name: t.name || '', team_workplace: t.workplace || '' };
}

export async function apiAcceptInvite(token: string): Promise<{ ok: boolean; error?: string; team_id?: string }> {
  const { data, error } = await supabase.rpc('accept_team_invite', { p_token: token });
  if (error) throw new Error(error.message);
  return data as { ok: boolean; error?: string; team_id?: string };
}

// ── Reimbursement Reports ─────────────────────

export interface ReimbursementResponse {
  id: string; team_id: string; user_id: string; submitter_name: string | null;
  period_label: string; period_start: string; period_end: string;
  business_km: number; rate: number; amount: number;
  note: string | null; reviewer_note: string | null;
  status: 'submitted' | 'approved' | 'rejected' | 'paid';
  created_at: string; reviewed_at: string | null; paid_at: string | null;
}

function normalizeReimbursement(r: any): ReimbursementResponse {
  return {
    ...r,
    business_km: Number(r.business_km) || 0,
    rate: Number(r.rate) || 0,
    amount: Number(r.amount) || 0,
  };
}

export async function apiSubmitReimbursement(input: {
  team_id: string; period_label: string; period_start: string; period_end: string;
  business_km: number; rate: number; amount: number; note?: string;
}): Promise<ReimbursementResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const submitter_name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member';
  const { data, error } = await supabase.from('reimbursement_reports')
    .insert({ ...input, user_id: user.id, submitter_name, status: 'submitted' })
    .select().single();
  if (error) throw new Error(error.message);
  return normalizeReimbursement(data);
}

// Reports the current user submitted (RLS returns own rows).
export async function apiListMyReimbursements(): Promise<ReimbursementResponse[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('reimbursement_reports')
    .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(normalizeReimbursement);
}

// Reports submitted to a team (RLS returns rows only for admins of that team).
export async function apiListTeamReimbursements(teamId: string): Promise<ReimbursementResponse[]> {
  const { data, error } = await supabase.from('reimbursement_reports')
    .select('*').eq('team_id', teamId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(normalizeReimbursement);
}

export async function apiUpdateReimbursementStatus(
  id: string,
  status: 'approved' | 'rejected' | 'paid',
  reviewerNote?: string,
): Promise<void> {
  const updates: Record<string, any> = { status };
  if (reviewerNote !== undefined) updates.reviewer_note = reviewerNote;
  if (status === 'paid') updates.paid_at = new Date().toISOString();
  else updates.reviewed_at = new Date().toISOString();
  const { error } = await supabase.from('reimbursement_reports').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── User Settings ─────────────────────────────

export interface UserSettingsResponse {
  user_id: string; mileage_rate: number; workplace_name: string | null;
  workplace_address: string | null; employee_number: string | null;
  subscription_tier: string; updated_at: string;
}

export async function apiGetSettings(): Promise<UserSettingsResponse | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function apiUpdateSettings(updates: Partial<{ mileage_rate: number; workplace_name: string; workplace_address: string; employee_number: string; subscription_tier: string }>): Promise<UserSettingsResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('user_settings')
    .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}
