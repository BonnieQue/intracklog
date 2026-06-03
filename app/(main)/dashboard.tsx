import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Modal, Pressable, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, useWindowDimensions, Linking, Keyboard, TouchableWithoutFeedback, Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoCompact } from '../../components/Logo';
import VehicleCard, { AddVehicleCard } from '../../components/VehicleCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { VehiclesIcon, TripsIcon, LocationsIcon, ReportsIcon, TeamsIcon, WorkplaceIcon, MileageRateIcon, OdometerIcon, GenerateReportIcon } from '../../components/icons/GridIcons';
import { useTheme } from '../../lib/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useEntryStore } from '../../stores/entryStore';
import { useToastStore } from '../../stores/toastStore';
import { useThemeStore } from '../../stores/themeStore';
import { apiListEntries, EntryResponse, apiListLocations, apiCreateLocation, apiDeleteLocation, apiListTeams, apiCreateTeam, apiDeleteTeam, apiListTeamMembers, apiAddTeamMember, apiRemoveTeamMember, apiListTeamInvites, apiSendTeamInvite, apiCancelTeamInvite, apiGetSettings, apiUpdateSettings, apiListTeamReimbursements, apiUpdateReimbursementStatus, ReimbursementResponse } from '../../lib/api';
import { WebView } from 'react-native-webview';
import { buildPayFastCheckoutHTML, PAYFAST_CONFIG, PAYFAST_SANDBOX } from '../../lib/payfast';
import { exportReportPDF, exportReportCSV, exportAllData } from '../../lib/exportReports';
import { scheduleDailyTripReminder, scheduleMonthlyReportReminder, cancelTripReminders, cancelAllNotifications, sendTestNotification } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { MiniBarChart, MiniDonut, ExpenseBreakdown } from '../../components/charts/MiniCharts';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { vehicles, loading, fetchVehicles, addVehicle } = useVehicleStore();
  const { resetDraft } = useEntryStore();
  const toast = useToastStore();
  const { colors: t, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  // screenWidth is only used for web sizing calculations
  const isMobile = Platform.OS !== 'web';
  const gridBtnSize = isMobile ? 85 : Math.min(160, (screenWidth - 80) / 5);
  const tile3Size = isMobile ? 108 : 360;
  const isLandscape = isMobile ? screenWidth > 500 : false;
  const toggleTheme = useThemeStore((s) => s.toggle);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMileage, setNewMileage] = useState('');
  const [allEntries, setAllEntries] = useState<EntryResponse[]>([]);
  const [savedLocations, setSavedLocations] = useState<{ id: string; name: string; address: string; city: string; country: string }[]>([]);
  const [showLocModal, setShowLocModal] = useState(false);
  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locCountry, setLocCountry] = useState('');
  // Teams
  interface TeamMember { id: string; name: string; email: string; role: 'admin' | 'member'; }
  interface PendingInvite { id: string; email: string; sentAt: string; token: string; }
  type RateType = 'standard' | 'custom' | 'none';
  interface Team { id: string; ownerId: string; name: string; workplace: string; workplaceAddress: string; rateType: RateType; customRate?: number; members: TeamMember[]; pendingInvites: PendingInvite[]; createdAt: string; }
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamView, setTeamView] = useState<'logbook' | string>('logbook');
  const [teamInnerTab, setTeamInnerTab] = useState<'members' | 'invitations' | 'reimbursements'>('members');
  const [teamReports, setTeamReports] = useState<ReimbursementResponse[]>([]);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showTripVehiclePicker, setShowTripVehiclePicker] = useState(false);
  const [slidePanel, setSlidePanel] = useState<'none' | 'editAccount' | 'settings'>('none');
  const [editAccountTab, setEditAccountTab] = useState<'subscription' | 'details'>('subscription');
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editEmployeeNo, setEditEmployeeNo] = useState('');
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [selectedTier, setSelectedTier] = useState('free');
  const [settingsTab, setSettingsTab] = useState<'main' | 'vehicles' | 'workplace' | 'rate' | 'odometer' | 'report' | 'notifications'>('main');
  const [notifTripReminders, setNotifTripReminders] = useState(false);
  const [notifMonthlyReport, setNotifMonthlyReport] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTier, setPaymentTier] = useState<{ key: string; name: string; price: string; period: string; color: string } | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentWebViewHtml, setPaymentWebViewHtml] = useState('');
  const [settingsRate, setSettingsRate] = useState('4.64');
  const [settingsWorkplaceName, setSettingsWorkplaceName] = useState('');
  const [settingsWorkplaceAddr, setSettingsWorkplaceAddr] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamWorkplace, setTeamWorkplace] = useState('');
  const [teamWorkplaceAddr, setTeamWorkplaceAddr] = useState('');
  const [teamRateType, setTeamRateType] = useState<RateType>('standard');
  const [teamCustomRate, setTeamCustomRate] = useState('');
  const [pendingTeam, setPendingTeam] = useState<Omit<Team, 'rateType' | 'customRate'> | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member');

  useEffect(() => { fetchVehicles(); }, []);

  // Load saved locations from Supabase
  useEffect(() => {
    apiListLocations().then((data) => {
      setSavedLocations(data.map((l) => ({ id: l.id, name: l.name, address: l.address || '', city: l.city || '', country: l.country || '' })));
    }).catch(() => {});
  }, []);

  const handleAddLocation = async () => {
    if (!locName) { toast.show('Please enter a location name.'); return; }
    try {
      const created = await apiCreateLocation({ name: locName, address: locAddress, city: locCity, country: locCountry });
      setSavedLocations([...savedLocations, { id: created.id, name: created.name, address: created.address || '', city: created.city || '', country: created.country || '' }]);
      setShowLocModal(false); setLocName(''); setLocAddress(''); setLocCity(''); setLocCountry('');
      toast.show('Location saved!');
    } catch (e: any) { toast.show(e.message || 'Failed to save location'); }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await apiDeleteLocation(id);
      setSavedLocations(savedLocations.filter((l) => l.id !== id));
    } catch (e: any) { toast.show(e.message || 'Failed to delete'); }
  };

  // Load all settings from Supabase
  useEffect(() => {
    apiGetSettings().then((s) => {
      if (!s) return;
      if (s.subscription_tier) setSelectedTier(s.subscription_tier);
      if (s.employee_number) setEditEmployeeNo(s.employee_number);
      if (s.mileage_rate) setSettingsRate(String(s.mileage_rate));
      if (s.workplace_name) setSettingsWorkplaceName(s.workplace_name);
      if (s.workplace_address) setSettingsWorkplaceAddr(s.workplace_address);
    }).catch(() => {});
  }, []);

  // Load teams from Supabase
  const loadTeams = async () => {
    try {
      const teamRows = await apiListTeams();
      const fullTeams: Team[] = await Promise.all(teamRows.map(async (tr) => {
        const [members, invites] = await Promise.all([
          apiListTeamMembers(tr.id).catch(() => []),
          apiListTeamInvites(tr.id).catch(() => []),
        ]);
        return {
          id: tr.id, ownerId: tr.owner_id, name: tr.name, workplace: tr.workplace,
          workplaceAddress: tr.workplace_address || '',
          rateType: (tr.rate_type as RateType) || 'standard',
          customRate: tr.custom_rate || undefined,
          members: members.map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role })),
          pendingInvites: invites.map((i) => ({ id: i.id, email: i.email, sentAt: i.sent_at.slice(0, 10), token: i.invite_token })),
          createdAt: tr.created_at.slice(0, 10),
        };
      }));
      setTeams(fullTeams);
    } catch {}
  };
  useEffect(() => { loadTeams(); }, []);

  // Reimbursement reports for the team being viewed (admins see all; others see none).
  const loadTeamReports = async (teamId: string) => {
    try { setTeamReports(await apiListTeamReimbursements(teamId)); } catch { setTeamReports([]); }
  };
  useEffect(() => {
    if (teamView !== 'logbook') loadTeamReports(teamView);
    else setTeamReports([]);
  }, [teamView]);

  const handleReimbursementAction = async (id: string, status: 'approved' | 'rejected' | 'paid') => {
    try {
      await apiUpdateReimbursementStatus(id, status);
      if (teamView !== 'logbook') await loadTeamReports(teamView);
      toast.show(`Marked ${status}`);
    } catch (e: any) { toast.show(e.message || 'Action failed'); }
  };

  // Step 1: Team name + workplace → show rate modal
  const handleTeamStep1 = () => {
    if (!teamName || !teamWorkplace) { toast.show('Please fill in team name and workplace.'); return; }
    if (teams.length >= currentLimits.teams) {
      const tierName = selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1);
      const limitText = currentLimits.teams === 0 ? `${tierName} plan does not include teams.` : `${tierName} plan supports up to ${currentLimits.teams} team(s).`;
      const upgradeText = Platform.OS === 'web' ? (currentLimits.teams === 0 ? 'Upgrade to Pro or Business.' : 'Upgrade to add more.') : 'Visit intracklog.com from any browser to upgrade.';
      toast.show(`${limitText} ${upgradeText}`);
      return;
    }
    setPendingTeam({
      id: '', name: teamName, workplace: teamWorkplace, workplaceAddress: teamWorkplaceAddr,
      ownerId: '', members: [], pendingInvites: [], createdAt: new Date().toISOString().slice(0, 10),
    });
    setShowTeamModal(false);
    setTeamRateType('standard'); setTeamCustomRate('');
    setShowRateModal(true);
  };

  // Step 2: Rate selection → save team to Supabase
  const handleTeamStep2 = async (skip?: boolean) => {
    if (!pendingTeam) return;
    try {
      const created = await apiCreateTeam({
        name: pendingTeam.name, workplace: pendingTeam.workplace,
        workplace_address: pendingTeam.workplaceAddress,
        rate_type: skip ? 'none' : teamRateType,
        custom_rate: teamRateType === 'custom' ? Number(teamCustomRate) || 0 : undefined,
      });
      await loadTeams();
      setShowRateModal(false); setPendingTeam(null);
      setTeamName(''); setTeamWorkplace(''); setTeamWorkplaceAddr('');
      setTeamView(created.id);
      toast.show('Team created!');
    } catch (e: any) { toast.show(e.message || 'Failed to create team'); }
  };

  const handleAddMember = async () => {
    if (!memberName || !memberEmail || !activeTeamId) { toast.show('Please fill in name and email.'); return; }
    const team = teams.find((t) => t.id === activeTeamId);
    if (team && team.members.length >= currentLimits.teamMembers) {
      const upgradeText = Platform.OS === 'web' ? 'Upgrade to add more.' : 'Visit intracklog.com from any browser to upgrade.';
      toast.show(`${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} plan supports up to ${currentLimits.teamMembers} team members. ${upgradeText}`);
      return;
    }
    try {
      await apiAddTeamMember(activeTeamId, { name: memberName, email: memberEmail, role: memberRole });
      await loadTeams();
      setShowMemberModal(false); setMemberName(''); setMemberEmail(''); setMemberRole('member');
      toast.show('Member added!');
    } catch (e: any) { toast.show(e.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      await apiRemoveTeamMember(memberId);
      await loadTeams();
    } catch (e: any) { toast.show(e.message || 'Failed to remove member'); }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await apiDeleteTeam(teamId);
      await loadTeams();
      if (teamView === teamId) setTeamView('logbook');
    } catch (e: any) { toast.show(e.message || 'Failed to delete team'); }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !activeTeamId) { toast.show('Please enter an email address.'); return; }
    try {
      await apiSendTeamInvite(activeTeamId, inviteEmail);
      // Trigger native email composer with invite link
      const team = teams.find((t) => t.id === activeTeamId);
      const subject = encodeURIComponent(`Join ${team?.name || 'a team'} on InTrackLog`);
      const body = encodeURIComponent(`Hi,\n\nYou've been invited to join ${team?.name || 'our team'} on InTrackLog. We share trip logs and mileage reports for our shared workplace at ${team?.workplace || ''}.\n\nGet the app: https://intracklog.com\n\nThanks,\n${user?.full_name || 'Team admin'}`);
      try { Linking.openURL(`mailto:${inviteEmail}?subject=${subject}&body=${body}`); } catch {}
      await loadTeams();
      setShowInviteModal(false); setInviteEmail('');
      toast.show('Invitation sent!');
    } catch (e: any) { toast.show(e.message || 'Failed to send invite'); }
  };

  const handleCancelInvite = async (teamId: string, inviteId: string) => {
    try {
      await apiCancelTeamInvite(inviteId);
      await loadTeams();
    } catch (e: any) { toast.show(e.message || 'Failed to cancel invite'); }
  };

  // Fetch entries for all vehicles to power dashboard stats
  useEffect(() => {
    if (vehicles.length === 0) return;
    const fetchAll = async () => {
      const results: EntryResponse[] = [];
      for (const v of vehicles) {
        try { const entries = await apiListEntries(v.id); results.push(...entries); } catch {}
      }
      setAllEntries(results);
    };
    fetchAll();
  }, [vehicles]);

  // Re-fetch entries whenever the dashboard regains focus (e.g. after returning from
  // trip-tracker or vehicle-detail). The dashboard stays mounted while you visit those
  // screens, so without this hook the stats stay stale at 0.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        const currentVehicles = useVehicleStore.getState().vehicles;
        if (currentVehicles.length === 0) return;
        const results: EntryResponse[] = [];
        for (const v of currentVehicles) {
          try { const entries = await apiListEntries(v.id); results.push(...entries); } catch {}
        }
        if (!cancelled) setAllEntries(results);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  // Monthly stats + chart data
  const monthStats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
    const thisMonth = allEntries.filter((e) => e.entry_date >= monthStart);
    const totalKm = thisMonth.reduce((sum, e) => sum + (e.trip_km || 0), 0);
    const totalExpense = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);
    const tripCount = thisMonth.filter((e) => e.trip_km && e.trip_km > 0).length;

    // Weekly trip counts (4 weeks)
    const weeklyTrips = [0, 0, 0, 0];
    const weeklyKm = [0, 0, 0, 0];
    thisMonth.forEach((e) => {
      const day = new Date(e.entry_date).getDate();
      const week = Math.min(3, Math.floor((day - 1) / 7));
      if (e.trip_km && e.trip_km > 0) weeklyTrips[week]++;
      weeklyKm[week] += (e.trip_km || 0);
    });

    // Expense breakdown by type
    const expenseMap: Record<string, number> = {};
    thisMonth.forEach((e) => {
      if (e.amount && e.amount > 0) {
        const type = e.expense_type || 'Other';
        expenseMap[type] = (expenseMap[type] || 0) + Number(e.amount);
      }
    });
    const expenseColors: Record<string, string> = { Fuel: '#52AD3B', Service: '#E07A3A', Tyres: '#85B7EB', Toll: '#AFA9EC', Other: '#E0C94A' };
    const expenseBreakdown = Object.entries(expenseMap).map(([name, amount]) => ({
      name, amount, color: expenseColors[name] || '#5DCAA5',
    }));

    return { totalKm, totalExpense, tripCount, weeklyTrips, weeklyKm, expenseBreakdown };
  }, [allEntries]);

  // Recent activity (last 5 entries)
  const recentEntries = useMemo(() => {
    return [...allEntries]
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
      .slice(0, 5);
  }, [allEntries]);

  const openVehicle = (vehicleId: string) => { resetDraft(); router.push({ pathname: '/(main)/vehicle-detail', params: { vehicleId } }); };

  // Subscription tier limits
  const TIER_LIMITS: Record<string, { vehicles: number; teams: number; teamMembers: number }> = {
    free: { vehicles: 3, teams: 0, teamMembers: 0 },
    starter: { vehicles: 5, teams: 0, teamMembers: 0 },
    pro: { vehicles: 10, teams: 1, teamMembers: 5 },
    business: { vehicles: Infinity, teams: Infinity, teamMembers: Infinity },
  };
  const currentLimits = TIER_LIMITS[selectedTier] || TIER_LIMITS.free;

  const handleAddVehicle = async () => {
    if (!newPlate || !newDesc) { toast.show('Please fill in licence plate and description.'); return; }
    if (vehicles.length >= currentLimits.vehicles) {
      const upgradeText = Platform.OS === 'web' ? 'Upgrade to add more.' : 'Visit intracklog.com from any browser to upgrade.';
      toast.show(`${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} plan supports up to ${currentLimits.vehicles} vehicles. ${upgradeText}`);
      return;
    }
    try { await addVehicle(newDesc, newPlate, newDesc, Number(newMileage) || 0, newPlate); setShowModal(false); setNewPlate(''); setNewDesc(''); setNewMileage(''); toast.show('Vehicle added!'); }
    catch (e: any) { toast.show(e.message || 'Failed to add vehicle'); }
  };

  const handleLogout = async () => { await logout(); router.replace('/'); };

  if (loading && vehicles.length === 0) return <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={t.accent} size="large" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.nav}>
        <Pressable onPress={() => setActiveSection(null)}><LogoCompact /></Pressable>
        <View style={styles.navRight}>
          <Pressable onPress={toggleTheme} style={[styles.toggleTrack, { backgroundColor: isDark ? t.accent : t.surface2 }]}>
            <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 14 : 2 }] }]} />
          </Pressable>
          <View>
            <Pressable onPress={() => setShowAccountMenu(!showAccountMenu)} style={[styles.accountBtn, { backgroundColor: t.surface2, borderColor: t.borderHover }]}>
              <Text style={[styles.accountText, { color: t.textMuted }]}>Account</Text>
              <Text style={[styles.accountArrow, { color: t.textMuted }]}>{showAccountMenu ? '▲' : '▼'}</Text>
            </Pressable>
            {showAccountMenu && (
              <View style={[styles.dropdown, { backgroundColor: t.surface2, borderColor: t.border }]}>
                <Pressable onPress={async () => {
                  setShowAccountMenu(false);
                  // Fetch fresh user data from Supabase
                  try {
                    const { data: { user: freshUser } } = await supabase.auth.getUser();
                    setEditName(freshUser?.user_metadata?.full_name || freshUser?.email?.split('@')[0] || '');
                    setEditEmail(freshUser?.email || '');
                  } catch {
                    setEditName(user?.full_name || '');
                    setEditEmail(user?.email || '');
                  }
                  AsyncStorage.getItem('employee_number').then((v) => setEditEmployeeNo(v || ''));
                  setEditCurrentPassword(''); setEditNewPassword('');
                  setEditAccountTab('details');
                  setSlidePanel(slidePanel === 'editAccount' ? 'none' : 'editAccount');
                }} style={styles.dropdownItem}>
                  <Text style={[styles.dropdownText, { color: slidePanel === 'editAccount' ? t.accent : t.text }]}>Edit Account</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: t.border }]} />
                <Pressable onPress={() => { setShowAccountMenu(false); setSettingsTab('main'); setSlidePanel(slidePanel === 'settings' ? 'none' : 'settings'); }} style={styles.dropdownItem}>
                  <Text style={[styles.dropdownText, { color: slidePanel === 'settings' ? t.accent : t.text }]}>Settings</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: t.border }]} />
                <Pressable onPress={() => { setShowAccountMenu(false); router.push('/(main)/help'); }} style={styles.dropdownItem}>
                  <Text style={[styles.dropdownText, { color: t.text }]}>Help & Support</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: t.border }]} />
                <Pressable onPress={() => { setShowAccountMenu(false); router.push('/(main)/privacy-policy'); }} style={styles.dropdownItem}>
                  <Text style={[styles.dropdownText, { color: t.text }]}>Privacy Policy</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: t.border }]} />
                <Pressable onPress={() => { setShowAccountMenu(false); router.push('/(main)/terms'); }} style={styles.dropdownItem}>
                  <Text style={[styles.dropdownText, { color: t.text }]}>Terms of Service</Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: t.border }]} />
                <Pressable onPress={() => { setShowAccountMenu(false); handleLogout(); }} style={styles.dropdownItem}>
                  <Text style={[styles.dropdownText, { color: t.error }]}>Log out</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Quick nav grid */}
        <View style={styles.navGrid}>
          {[
            { Icon: VehiclesIcon, label: 'Vehicles', onPress: () => setActiveSection(activeSection === 'Vehicles' ? null : 'Vehicles') },
            { Icon: TripsIcon, label: 'Trips', onPress: () => setActiveSection(activeSection === 'Trips' ? null : 'Trips') },
            { Icon: LocationsIcon, label: 'Locations', onPress: () => setActiveSection(activeSection === 'Locations' ? null : 'Locations') },
            { Icon: ReportsIcon, label: 'Reports', onPress: () => router.push('/(main)/expense-report') },
            { Icon: TeamsIcon, label: 'Teams', onPress: () => setActiveSection(activeSection === 'Teams' ? null : 'Teams') },
          ].map((item) => {
            const active = activeSection === item.label;
            const iconColor = active ? '#ffffff' : t.textMuted;
            return (
              <TouchableOpacity key={item.label} onPress={item.onPress} activeOpacity={0.7} style={[styles.gridBtn, { width: gridBtnSize, height: gridBtnSize, backgroundColor: active ? t.accent : t.surface, borderColor: active ? t.accent : t.border }]}>
                <item.Icon size={Math.max(18, gridBtnSize * 0.28)} color={iconColor} />
                <Text style={[styles.gridLabel, { color: active ? '#ffffff' : t.text, fontSize: Math.max(9, gridBtnSize * 0.1) }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Home view — GlobalRide-style tile grid */}
        {!activeSection && (
          <View style={styles.homeSection}>
            {/* Top stat tiles row */}
            <View style={styles.tileRow}>
              <View style={[styles.tile, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.tileHeader, { color: t.textMuted }]}>Total trips</Text>
                <Text style={[styles.tileBigNum, { color: t.info }]}>{monthStats.tripCount}</Text>
                <View style={styles.chartWrap}>
                  <MiniBarChart
                    data={monthStats.weeklyTrips}
                    labels={['W1', 'W2', 'W3', 'W4']}
                    width={110}
                    height={45}
                    barColors={['#85B7EB', '#5DCAA5', '#AFA9EC', '#E07A3A']}
                  />
                </View>
              </View>
              <View style={[styles.tile, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.tileHeader, { color: t.textMuted }]}>Distance driven</Text>
                <View style={styles.tileNumRow}>
                  <Text style={[styles.tileBigNum, { color: t.accent }]}>{monthStats.totalKm.toLocaleString()}</Text>
                  <Text style={[styles.tileSuffix, { color: t.accent }]}>km</Text>
                </View>
                <View style={styles.chartWrap}>
                  <MiniBarChart
                    data={monthStats.weeklyKm}
                    labels={['W1', 'W2', 'W3', 'W4']}
                    width={110}
                    height={45}
                    barColors={['#52AD3B', '#85B7EB', '#E07A3A', '#AFA9EC']}
                  />
                </View>
              </View>
            </View>

            {/* Current vehicle tile — full width */}
            {vehicles.length > 0 && (
              <TouchableOpacity onPress={() => openVehicle(vehicles[0].id)} activeOpacity={0.8} style={[styles.tileFull, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.tileHeader, { color: t.textMuted }]}>Current vehicle</Text>
                <View style={styles.currentVehicleRow}>
                  <View style={[styles.currentVehicleBadge, { backgroundColor: t.accentBg }]}>
                    <Text style={[styles.currentVehicleLetter, { color: t.accent }]}>{(vehicles[0].description || vehicles[0].name || 'V').charAt(0)}</Text>
                  </View>
                  <View style={styles.currentVehicleInfo}>
                    <Text style={[styles.currentVehicleName, { color: t.text }]}>{vehicles[0].description || vehicles[0].name}</Text>
                    <View style={styles.currentVehicleDetails}>
                      <View style={[styles.detailChip, { backgroundColor: t.accentBg }]}>
                        <Text style={[styles.detailChipText, { color: t.accent }]}>{vehicles[0].reg_number || 'No plate'}</Text>
                      </View>
                      <View style={[styles.detailChip, { backgroundColor: t.secondaryBg }]}>
                        <Text style={[styles.detailChipText, { color: t.secondary }]}>{(vehicles[0].start_mileage || 0).toLocaleString()} km</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.tileArrow, { color: t.textMuted }]}>›</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Schedule of trips + Latest odometer */}
            <View style={styles.tileRow}>
              {recentEntries.length > 0 && (
                <View style={[styles.tile, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <Text style={[styles.tileHeader, { color: t.textMuted, fontSize: 10, marginBottom: 6 }]}>Recent trips</Text>
                  {recentEntries.slice(0, 3).map((entry) => {
                    const v = vehicles.find((veh) => veh.id === entry.vehicle_id);
                    const isTrip = entry.trip_km && entry.trip_km > 0;
                    return (
                      <View key={entry.id} style={[styles.scheduleRow, { borderTopColor: t.border }]}>
                        <Text style={[styles.scheduleVehicle, { color: t.text }]} numberOfLines={1}>{v?.description || v?.name || 'Vehicle'}</Text>
                        <Text style={[styles.scheduleKm, { color: t.textMuted }]}>{entry.trip_km || 0} km</Text>
                        <View style={[styles.statusBadge, { backgroundColor: isTrip ? 'rgba(82,173,59,0.12)' : 'rgba(224,122,58,0.12)' }]}>
                          <Text style={[styles.statusText, { color: isTrip ? t.accent : t.secondary }]}>{entry.expense_type || 'Trip'}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              {vehicles.length > 0 && (() => {
                // Find the last used vehicle (most recent entry overall)
                const sortedAll = [...allEntries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
                const lastEntry = sortedAll[0];
                const lastVehicle = lastEntry ? vehicles.find((v) => v.id === lastEntry.vehicle_id) : vehicles[0];
                const veh = lastVehicle || vehicles[0];
                // Compute the latest odometer reading
                const vehEntries = allEntries.filter((e) => e.vehicle_id === veh.id);
                const startKm = Number(veh.start_mileage) || 0;
                const manualMax = vehEntries.reduce((max, e) => Math.max(max, Number(e.reading_km) || 0), 0);
                const tripsTotal = vehEntries.reduce((sum, e) => sum + (Number(e.trip_km) || 0), 0);
                const latestReading = Math.max(startKm, manualMax, Math.round(startKm + tripsTotal));
                const digits = String(latestReading).padStart(6, '0').split('');
                return (
                  <View style={[styles.tile, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <Text style={[styles.tileHeader, { color: t.textMuted, fontSize: 10, marginBottom: 8 }]}>Latest odometer</Text>
                    {/* Odometer display — old school casing */}
                    <View style={[styles.odoDisplay, { backgroundColor: isDark ? '#0a0a0e' : '#e8e8ec', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)' }]}>
                      <View style={[styles.odoTopLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                      <View style={[styles.odoCasing, { backgroundColor: isDark ? '#06060a' : '#d8d8de', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)' }]}>
                        <View style={styles.odoDigits}>
                          {digits.map((d, i) => {
                            const isLast = i === digits.length - 1;
                            return (
                              <View key={i} style={[styles.odoDigitBox, { backgroundColor: isDark ? (isLast ? '#1a1a1a' : '#141416') : (isLast ? '#f0f0f0' : '#eaeaee'), borderColor: isLast ? t.accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)') }]}>
                                <Text style={[styles.odoDigitText, { color: isLast ? t.accent : (isDark ? '#e8e8e0' : '#1a1a1f') }]}>{d}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                      <View style={[styles.odoBottomLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                      <Text style={styles.odoKmLabel}>km</Text>
                    </View>
                    <View style={styles.odoVehicle}>
                      <View style={[styles.odoVehicleDot, { backgroundColor: t.accent }]} />
                      <Text style={[styles.odoVehicleName, { color: t.text }]} numberOfLines={1}>{veh.description || veh.name}</Text>
                    </View>
                    <Text style={[styles.odoPlate, { color: t.textMuted }]}>{veh.reg_number || ''}</Text>
                    {lastEntry ? <Text style={[styles.odoDate, { color: t.textGrey }]}>Last: {new Date(lastEntry.entry_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</Text> : null}
                  </View>
                );
              })()}
            </View>

            {/* Quick start trip */}
            {vehicles.length > 0 && (
              <View>
                {Platform.OS === 'web' && (
                  <Text style={[styles.tripMobileNote, { color: t.textMuted }]}>GPS trip tracking is only available on the mobile app.</Text>
                )}
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === 'web') { toast.show('GPS trip tracking is only available on the mobile app.'); return; }
                    if (vehicles.length === 1) {
                      router.push({ pathname: '/(main)/trip-tracker', params: { vehicleId: vehicles[0].id } });
                    } else {
                      setShowTripVehiclePicker(!showTripVehiclePicker);
                    }
                  }}
                  activeOpacity={0.8}
                  style={[styles.quickStart, { backgroundColor: t.accent }]}
                >
                  <TripsIcon size={22} color="#ffffff" />
                  <Text style={styles.quickStartText}>Start a trip</Text>
                </TouchableOpacity>
                {showTripVehiclePicker && vehicles.length > 1 && (
                  <View style={[styles.tripPickerList, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <Text style={[styles.tripPickerTitle, { color: t.textMuted }]}>Select a vehicle</Text>
                    {vehicles.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => {
                          setShowTripVehiclePicker(false);
                          router.push({ pathname: '/(main)/trip-tracker', params: { vehicleId: v.id } });
                        }}
                        style={[styles.tripPickerRow, { borderTopColor: t.border }]}
                      >
                        <Text style={[styles.tripPickerName, { color: t.text }]}>{v.description || v.name}</Text>
                        <Text style={[styles.tripPickerPlate, { color: t.textMuted }]}>{v.reg_number || ''}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeSection === 'Vehicles' && (
          <>
            <Text style={[styles.heading, { color: t.text }]}>Your <Text style={[styles.headingAccent, { color: t.accent }]}>vehicles</Text></Text>
            <Text style={[styles.sub, { color: t.textMuted }]}>Select a vehicle to log mileage and expenses, or add a new one.</Text>
            <View style={styles.list}>
              {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} onPress={() => openVehicle(v.id)} />)}
              <AddVehicleCard onPress={() => setShowModal(true)} />
            </View>
          </>
        )}

        {activeSection === 'Trips' && (() => {
          const tripEntries = allEntries
            .filter((e) => e.trip_km && e.trip_km > 0)
            .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
          const totalKm = tripEntries.reduce((s, e) => s + (e.trip_km || 0), 0);
          const totalExpense = tripEntries.reduce((s, e) => s + (e.amount || 0), 0);
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
          const thisMonthTrips = tripEntries.filter((e) => e.entry_date >= monthStart);
          const monthKm = thisMonthTrips.reduce((s, e) => s + (e.trip_km || 0), 0);
          const monthExpense = thisMonthTrips.reduce((s, e) => s + (e.amount || 0), 0);

          // Build expense type totals for summary table
          const typeTotals: Record<string, { km: number; amount: number }> = {};
          tripEntries.forEach((e) => {
            const type = e.expense_type || 'Trip';
            if (!typeTotals[type]) typeTotals[type] = { km: 0, amount: 0 };
            typeTotals[type].km += (e.trip_km || 0);
            typeTotals[type].amount += Number(e.amount || 0);
          });

          // Date range
          const oldest = tripEntries.length > 0 ? tripEntries[tripEntries.length - 1].entry_date : '';
          const newest = tripEntries.length > 0 ? tripEntries[0].entry_date : '';
          const formatDate = (d: string) => {
            if (!d) return '';
            const dt = new Date(d);
            return `${dt.getDate()} ${dt.toLocaleString('default', { month: 'short' })} ${dt.getFullYear()}`;
          };

          return (
            <View style={styles.tripReport}>
              {/* Report header */}
              <Text style={[styles.rptTitle, { color: t.text }]}>Report</Text>
              <Text style={[styles.rptDateRange, { color: t.textMuted }]}>
                {oldest ? `${formatDate(oldest)} - ${formatDate(newest)}` : 'No trips yet'}
              </Text>

              {/* Summary table */}
              <Text style={[styles.rptSectionTitle, { color: t.accent }]}>Summary</Text>
              <View style={[styles.rptSumTable, { borderBottomColor: t.border }]}>
                {/* Header */}
                <View style={[styles.rptSumRow, { borderBottomColor: t.border, borderBottomWidth: 1 }]}>
                  <Text style={[styles.rptSumHead, { color: t.textGrey, flex: 1.2 }]}>Type</Text>
                  <Text style={[styles.rptSumHead, { color: t.textGrey, flex: 1, textAlign: 'right' }]}>Distance</Text>
                  <Text style={[styles.rptSumHead, { color: t.textGrey, flex: 1, textAlign: 'right' }]}>Amount</Text>
                </View>
                {Object.entries(typeTotals).map(([type, vals]) => (
                  <View key={type} style={styles.rptSumRow}>
                    <Text style={[styles.rptSumCell, { color: t.text, flex: 1.2 }]}>{type}</Text>
                    <Text style={[styles.rptSumCell, { color: t.text, flex: 1, textAlign: 'right' }]}>{vals.km.toLocaleString()} km</Text>
                    <Text style={[styles.rptSumCell, { color: t.text, flex: 1, textAlign: 'right' }]}>R {vals.amount.toLocaleString()}</Text>
                  </View>
                ))}
                {/* Total */}
                <View style={[styles.rptSumRow, { borderTopColor: t.text, borderTopWidth: 1, marginTop: 4 }]}>
                  <Text style={[styles.rptSumTotal, { color: t.text, flex: 1.2 }]}>Total</Text>
                  <Text style={[styles.rptSumTotal, { color: t.text, flex: 1, textAlign: 'right' }]}>{totalKm.toLocaleString()} km</Text>
                  <Text style={[styles.rptSumTotal, { color: t.text, flex: 1, textAlign: 'right' }]}>R {totalExpense.toLocaleString()}</Text>
                </View>
              </View>

              {/* Individual trip entries */}
              {tripEntries.slice(0, 15).map((entry) => {
                const v = vehicles.find((veh) => veh.id === entry.vehicle_id);
                let fromLoc = '';
                let toLoc = '';
                if (entry.notes && entry.notes.startsWith('FROM:')) {
                  const match = entry.notes.match(/^FROM:\s*(.+?)\s*→\s*TO:\s*(.+)$/);
                  if (match) { fromLoc = match[1]; toLoc = match[2]; }
                }
                const dt = new Date(entry.entry_date);
                const dayLabel = `${dt.getDate()} ${dt.toLocaleString('default', { month: 'short' })}`;
                const expType = entry.expense_type || 'Trip';

                return (
                  <View key={entry.id} style={[styles.rptEntry, { borderBottomColor: t.borderHover }]}>
                    {/* Date label */}
                    <Text style={[styles.rptEntryDate, { color: t.textMuted }]}>{dayLabel}</Text>

                    {/* Route timeline */}
                    <View style={styles.rptRouteWrap}>
                      <View style={styles.rptTimeline}>
                        <View style={[styles.rptDotHollow, { borderColor: t.textMuted }]} />
                        <View style={[styles.rptTimelineLine, { backgroundColor: t.border }]} />
                        <View style={[styles.rptDotFilled, { backgroundColor: t.text }]} />
                      </View>
                      <View style={styles.rptLocations}>
                        <Text style={[styles.rptLocText, { color: t.text }]} numberOfLines={1}>
                          {fromLoc || 'Start location not recorded'}
                        </Text>
                        <Text style={[styles.rptLocText, { color: t.text }]} numberOfLines={1}>
                          {toLoc || 'End location not recorded'}
                        </Text>
                      </View>
                    </View>

                    {/* Trip meta row */}
                    <View style={styles.rptMeta}>
                      <View style={[styles.rptMetaBadge, { backgroundColor: t.accentBg }]}>
                        <Text style={[styles.rptMetaBadgeText, { color: t.accent }]}>{expType}</Text>
                      </View>
                      <Text style={[styles.rptMetaVal, { color: t.text }]}>{entry.trip_km} km</Text>
                      <Text style={[styles.rptMetaVal, { color: t.text }]}>R {entry.amount || '0'}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}

        {activeSection === 'Locations' && (() => {
          // Extract unique locations from trip notes
          const locationMap: Record<string, { count: number; totalKm: number; lastDate: string; vehicles: Set<string> }> = {};
          allEntries.forEach((e) => {
            if (!e.notes) return;
            const match = e.notes.match(/^FROM:\s*(.+?)\s*→\s*TO:\s*(.+)$/);
            if (match) {
              [match[1], match[2]].forEach((loc) => {
                if (loc === 'Unknown') return;
                if (!locationMap[loc]) locationMap[loc] = { count: 0, totalKm: 0, lastDate: '', vehicles: new Set() };
                locationMap[loc].count++;
                locationMap[loc].totalKm += (e.trip_km || 0);
                if (e.entry_date > locationMap[loc].lastDate) locationMap[loc].lastDate = e.entry_date;
                const v = vehicles.find((veh) => veh.id === e.vehicle_id);
                if (v) locationMap[loc].vehicles.add(v.description || v.name || '');
              });
            }
          });
          const locations = Object.entries(locationMap)
            .sort((a, b) => b[1].count - a[1].count);

          return (
            <View style={styles.locSection}>
              <Text style={[styles.rptTitle, { color: t.text }]}>Locations</Text>
              <Text style={[styles.rptDateRange, { color: t.textMuted }]}>
                {locations.length} place{locations.length !== 1 ? 's' : ''} visited across all trips
              </Text>

              {/* Saved / bookmarked locations */}
              {savedLocations.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.rptSectionTitle, { color: t.accent }]}>Saved places</Text>
                  {savedLocations.map((loc) => {
                    // Match saved location against trip data
                    const matchingTrips = allEntries.filter((e) => {
                      if (!e.notes) return false;
                      return e.notes.toLowerCase().includes(loc.name.toLowerCase()) ||
                        (loc.address && e.notes.toLowerCase().includes(loc.address.toLowerCase()));
                    });
                    const tripCount = matchingTrips.length;
                    const totalKmForLoc = matchingTrips.reduce((s, e) => s + (e.trip_km || 0), 0);
                    return (
                      <View key={loc.id} style={[styles.locCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                        <View style={styles.locHeader}>
                          <View style={[styles.locPin, { backgroundColor: t.accentBg }]}>
                            <LocationsIcon size={16} color={t.accent} />
                          </View>
                          <View style={styles.locInfo}>
                            <Text style={[styles.locName, { color: t.text }]}>{loc.name}</Text>
                            {loc.address ? <Text style={[styles.locLastVisit, { color: t.textMuted }]}>{loc.address}</Text> : null}
                            {(loc.city || loc.country) ? <Text style={[styles.locLastVisit, { color: t.textMuted }]}>{[loc.city, loc.country].filter(Boolean).join(', ')}</Text> : null}
                          </View>
                          <Pressable onPress={() => handleDeleteLocation(loc.id)} hitSlop={10}>
                            <Text style={{ color: t.textGrey, fontSize: 16 }}>✕</Text>
                          </Pressable>
                        </View>
                        <View style={[styles.locStats, { borderTopColor: t.border }]}>
                          <View style={styles.locStatItem}>
                            <Text style={[styles.locStatValue, { color: t.accent }]}>{tripCount}</Text>
                            <Text style={[styles.locStatLabel, { color: t.textMuted }]}>{tripCount === 1 ? 'trip' : 'trips'}</Text>
                          </View>
                          <View style={[styles.locStatDivider, { backgroundColor: t.border }]} />
                          <View style={styles.locStatItem}>
                            <Text style={[styles.locStatValue, { color: t.info }]}>{Math.round(totalKmForLoc).toLocaleString()}</Text>
                            <Text style={[styles.locStatLabel, { color: t.textMuted }]}>km</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Add location button */}
              <TouchableOpacity onPress={() => setShowLocModal(true)} style={[styles.locAddBtn, { borderColor: t.border }]}>
                <Text style={[styles.locAddIcon, { color: t.accent }]}>+</Text>
                <Text style={[styles.locAddText, { color: t.textMuted }]}>Add a saved location</Text>
              </TouchableOpacity>

              {/* Trip-discovered locations */}
              {locations.length > 0 && (
                <Text style={[styles.rptSectionTitle, { color: t.accent, marginTop: 20 }]}>Discovered from trips</Text>
              )}

              {locations.length === 0 && savedLocations.length === 0 && (
                <View style={[styles.locEmpty, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <LocationsIcon size={32} color={t.textMuted} />
                  <Text style={[styles.locEmptyText, { color: t.textMuted }]}>No locations recorded yet. Start a GPS trip to log your routes.</Text>
                </View>
              )}

              {locations.map(([name, data], i) => (
                <View key={name} style={[styles.locCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <View style={styles.locHeader}>
                    <View style={[styles.locPin, { backgroundColor: [t.accent, t.secondary, t.info, '#AFA9EC', '#E0C94A'][i % 5] + '1A' }]}>
                      <LocationsIcon size={16} color={[t.accent, t.secondary, t.info, '#AFA9EC', '#E0C94A'][i % 5]} />
                    </View>
                    <View style={styles.locInfo}>
                      <Text style={[styles.locName, { color: t.text }]} numberOfLines={2}>{name}</Text>
                      <Text style={[styles.locLastVisit, { color: t.textMuted }]}>Last visited: {data.lastDate}</Text>
                    </View>
                  </View>
                  <View style={[styles.locStats, { borderTopColor: t.border }]}>
                    <View style={styles.locStatItem}>
                      <Text style={[styles.locStatValue, { color: t.accent }]}>{data.count}</Text>
                      <Text style={[styles.locStatLabel, { color: t.textMuted }]}>{data.count === 1 ? 'visit' : 'visits'}</Text>
                    </View>
                    <View style={[styles.locStatDivider, { backgroundColor: t.border }]} />
                    <View style={styles.locStatItem}>
                      <Text style={[styles.locStatValue, { color: t.info }]}>{Math.round(data.totalKm).toLocaleString()}</Text>
                      <Text style={[styles.locStatLabel, { color: t.textMuted }]}>km total</Text>
                    </View>
                    <View style={[styles.locStatDivider, { backgroundColor: t.border }]} />
                    <View style={styles.locStatItem}>
                      <Text style={[styles.locStatValue, { color: t.secondary }]}>{data.vehicles.size}</Text>
                      <Text style={[styles.locStatLabel, { color: t.textMuted }]}>{data.vehicles.size === 1 ? 'vehicle' : 'vehicles'}</Text>
                    </View>
                  </View>
                  {data.vehicles.size > 0 && (
                    <View style={styles.locVehicles}>
                      {Array.from(data.vehicles).map((vName) => (
                        <View key={vName} style={[styles.locVehicleChip, { backgroundColor: t.accentBg }]}>
                          <Text style={[styles.locVehicleChipText, { color: t.accent }]}>{vName}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          );
        })()}

        {activeSection === 'Teams' && (
          <View style={styles.teamSection}>
            {/* Team dropdown selector */}
            <View style={{ zIndex: 20, marginBottom: 16 }}>
              <Pressable onPress={() => setShowTeamDropdown(!showTeamDropdown)} style={[styles.teamDropdownBtn, { backgroundColor: t.surface, borderColor: t.borderHover }]}>
                <Text style={[styles.teamDropdownText, { color: t.text }]}>
                  {teamView === 'logbook' ? 'My Logbook' : teams.find((tm) => tm.id === teamView)?.name || 'Select'}
                </Text>
                <Text style={[styles.accountArrow, { color: t.textMuted }]}>{showTeamDropdown ? '▲' : '▼'}</Text>
              </Pressable>
              {showTeamDropdown && (
                <View style={[styles.teamDropdownList, { backgroundColor: t.surface2, borderColor: t.border }]}>
                  <Pressable onPress={() => { setTeamView('logbook'); setShowTeamDropdown(false); }} style={styles.teamDropdownItem}>
                    <Text style={[styles.teamDropdownItemText, { color: teamView === 'logbook' ? t.accent : t.text }]}>My Logbook</Text>
                  </Pressable>
                  {teams.map((tm) => (
                    <Pressable key={tm.id} onPress={() => { setTeamView(tm.id); setShowTeamDropdown(false); }} style={[styles.teamDropdownItem, { borderTopWidth: 1, borderTopColor: t.border }]}>
                      <Text style={[styles.teamDropdownItemText, { color: teamView === tm.id ? t.accent : t.text }]}>{tm.name}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => { setShowTeamDropdown(false); setShowTeamModal(true); }} style={[styles.teamDropdownItem, { borderTopWidth: 1, borderTopColor: t.border }]}>
                    <Text style={[styles.teamDropdownItemText, { color: t.accent }]}>+ Create a new team</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* My Logbook view */}
            {teamView === 'logbook' && (
              <View>
                <Text style={[styles.rptTitle, { color: t.text }]}>My Logbook</Text>
                <Text style={[styles.rptDateRange, { color: t.textMuted }]}>
                  Your personal trip log across all teams.
                </Text>
                {allEntries.filter((e) => e.trip_km && e.trip_km > 0).length === 0 ? (
                  <View style={[styles.locEmpty, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <TripsIcon size={32} color={t.textMuted} />
                    <Text style={[styles.locEmptyText, { color: t.textMuted }]}>No trips logged yet. Start a GPS trip to see your logbook here.</Text>
                  </View>
                ) : (
                  allEntries.filter((e) => e.trip_km && e.trip_km > 0).sort((a, b) => b.entry_date.localeCompare(a.entry_date)).slice(0, 8).map((entry) => {
                    const v = vehicles.find((veh) => veh.id === entry.vehicle_id);
                    let fromLoc = ''; let toLoc = '';
                    if (entry.notes?.startsWith('FROM:')) {
                      const match = entry.notes.match(/^FROM:\s*(.+?)\s*→\s*TO:\s*(.+)$/);
                      if (match) { fromLoc = match[1]; toLoc = match[2]; }
                    }
                    return (
                      <View key={entry.id} style={[styles.rptEntry, { borderBottomColor: t.borderHover }]}>
                        <Text style={[styles.rptEntryDate, { color: t.textMuted }]}>{entry.entry_date}</Text>
                        <View style={styles.rptRouteWrap}>
                          <View style={styles.rptTimeline}>
                            <View style={[styles.rptDotHollow, { borderColor: t.textMuted }]} />
                            <View style={[styles.rptTimelineLine, { backgroundColor: t.border }]} />
                            <View style={[styles.rptDotFilled, { backgroundColor: t.text }]} />
                          </View>
                          <View style={styles.rptLocations}>
                            <Text style={[styles.rptLocText, { color: t.text }]} numberOfLines={1}>{fromLoc || 'Start not recorded'}</Text>
                            <Text style={[styles.rptLocText, { color: t.text }]} numberOfLines={1}>{toLoc || 'End not recorded'}</Text>
                          </View>
                        </View>
                        <View style={styles.rptMeta}>
                          <View style={[styles.rptMetaBadge, { backgroundColor: t.accentBg }]}>
                            <Text style={[styles.rptMetaBadgeText, { color: t.accent }]}>{entry.expense_type || 'Trip'}</Text>
                          </View>
                          <Text style={[styles.rptMetaVal, { color: t.text }]}>{entry.trip_km} km</Text>
                          <Text style={[styles.rptMetaVal, { color: t.text }]}>R {entry.amount || '0'}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* Individual team view */}
            {teamView !== 'logbook' && (() => {
              const team = teams.find((tm) => tm.id === teamView);
              if (!team) return null;
              const teamTrips = allEntries.filter((e) => e.notes && e.notes.toLowerCase().includes(team.workplace.toLowerCase()));
              const teamKm = teamTrips.reduce((s, e) => s + (e.trip_km || 0), 0);
              const rateLabel = team.rateType === 'standard' ? 'Standard rate' : team.rateType === 'custom' ? `R ${team.customRate}/km` : 'No rate set';
              const pendingCount = (team.pendingInvites || []).length;
              const reimbPending = teamReports.filter((r) => r.status === 'submitted').length;

              return (
                <View>
                  {/* Team info bar */}
                  <View style={[styles.teamInfoBar, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <View style={styles.teamHeader}>
                      <View style={[styles.teamIcon, { backgroundColor: t.accentBg }]}>
                        <TeamsIcon size={18} color={t.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.teamName, { color: t.text }]}>{team.name}</Text>
                        <Text style={[styles.teamCreated, { color: t.textGrey }]}>{rateLabel} — {team.members.length} members</Text>
                      </View>
                      <Pressable onPress={() => handleDeleteTeam(team.id)} hitSlop={10}>
                        <Text style={{ color: t.textGrey, fontSize: 16 }}>✕</Text>
                      </Pressable>
                    </View>
                    <View style={[styles.teamWorkplace, { backgroundColor: t.accentBg, borderColor: t.accentBorder }]}>
                      <View style={styles.teamWorkplaceHeader}>
                        <LocationsIcon size={14} color={t.accent} />
                        <Text style={[styles.teamWorkplaceLabel, { color: t.accent }]}>Shared workplace</Text>
                      </View>
                      <Text style={[styles.teamWorkplaceName, { color: t.text }]}>{team.workplace}</Text>
                      {team.workplaceAddress ? <Text style={[styles.teamWorkplaceAddr, { color: t.textMuted }]}>{team.workplaceAddress}</Text> : null}
                    </View>
                    <View style={[styles.teamStats, { borderTopColor: t.border }]}>
                      <View style={styles.locStatItem}>
                        <Text style={[styles.locStatValue, { color: t.accent }]}>{teamTrips.length}</Text>
                        <Text style={[styles.locStatLabel, { color: t.textMuted }]}>trips</Text>
                      </View>
                      <View style={[styles.locStatDivider, { backgroundColor: t.border }]} />
                      <View style={styles.locStatItem}>
                        <Text style={[styles.locStatValue, { color: t.info }]}>{Math.round(teamKm).toLocaleString()}</Text>
                        <Text style={[styles.locStatLabel, { color: t.textMuted }]}>km total</Text>
                      </View>
                    </View>
                  </View>

                  {/* Inner tab bar */}
                  <View style={styles.teamTabBar}>
                    <Pressable onPress={() => setTeamInnerTab('members')} style={[styles.teamTab, teamInnerTab === 'members' && { borderBottomColor: t.accent, borderBottomWidth: 2 }]}>
                      <Text style={[styles.teamTabText, { color: teamInnerTab === 'members' ? t.accent : t.textMuted }]}>Members ({team.members.length})</Text>
                    </Pressable>
                    <Pressable onPress={() => setTeamInnerTab('invitations')} style={[styles.teamTab, teamInnerTab === 'invitations' && { borderBottomColor: t.accent, borderBottomWidth: 2 }]}>
                      <Text style={[styles.teamTabText, { color: teamInnerTab === 'invitations' ? t.accent : t.textMuted }]}>
                        Pending{pendingCount > 0 ? ` (${pendingCount})` : ''}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setTeamInnerTab('reimbursements')} style={[styles.teamTab, teamInnerTab === 'reimbursements' && { borderBottomColor: t.accent, borderBottomWidth: 2 }]}>
                      <Text style={[styles.teamTabText, { color: teamInnerTab === 'reimbursements' ? t.accent : t.textMuted }]}>
                        Claims{reimbPending > 0 ? ` (${reimbPending})` : ''}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Members tab */}
                  {teamInnerTab === 'members' && (
                    <View style={[styles.teamCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                      <View style={styles.teamMembersHeader}>
                        <Text style={[styles.teamMembersTitle, { color: t.text }]}>Team members</Text>
                        <Pressable onPress={() => { setActiveTeamId(team.id); setShowMemberModal(true); }}>
                          <Text style={[styles.teamAddMemberBtn, { color: t.accent }]}>+ Add</Text>
                        </Pressable>
                      </View>
                      {team.members.map((member) => (
                        <View key={member.id} style={[styles.teamMemberRow, { borderTopColor: t.border }]}>
                          <View style={[styles.teamMemberAvatar, { backgroundColor: member.role === 'admin' ? t.secondaryBg : t.accentBg }]}>
                            <Text style={[styles.teamMemberInitial, { color: member.role === 'admin' ? t.secondary : t.accent }]}>{member.name.charAt(0)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.teamMemberName, { color: t.text }]}>{member.name}</Text>
                            <Text style={[styles.teamMemberEmail, { color: t.textMuted }]}>{member.email}</Text>
                          </View>
                          <View style={[styles.teamRoleBadge, { backgroundColor: member.role === 'admin' ? t.secondaryBg : t.accentBg }]}>
                            <Text style={[styles.teamRoleText, { color: member.role === 'admin' ? t.secondary : t.accent }]}>{member.role === 'admin' ? 'Admin' : 'Member'}</Text>
                          </View>
                          {member.id !== '0' && (
                            <Pressable onPress={() => handleRemoveMember(team.id, member.id)} hitSlop={10} style={{ marginLeft: 8 }}>
                              <Text style={{ color: t.textGrey, fontSize: 14 }}>✕</Text>
                            </Pressable>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Pending invitations tab */}
                  {teamInnerTab === 'invitations' && (
                    <View style={[styles.teamCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                      <View style={styles.teamMembersHeader}>
                        <Text style={[styles.teamMembersTitle, { color: t.text }]}>Pending invitations</Text>
                        <Pressable onPress={() => { setActiveTeamId(team.id); setShowInviteModal(true); }}>
                          <Text style={[styles.teamAddMemberBtn, { color: t.accent }]}>+ Send invite</Text>
                        </Pressable>
                      </View>
                      {(team.pendingInvites || []).length === 0 && (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                          <Text style={[styles.locEmptyText, { color: t.textMuted }]}>No pending invitations.</Text>
                          <Pressable onPress={() => { setActiveTeamId(team.id); setShowInviteModal(true); }} style={{ marginTop: 12 }}>
                            <Text style={[styles.teamAddMemberBtn, { color: t.accent, fontSize: 14 }]}>Send an invite</Text>
                          </Pressable>
                        </View>
                      )}
                      {(team.pendingInvites || []).map((inv) => (
                        <View key={inv.id} style={[styles.teamMemberRow, { borderTopColor: t.border }]}>
                          <View style={[styles.teamMemberAvatar, { backgroundColor: 'rgba(224,201,74,0.12)' }]}>
                            <Text style={[styles.teamMemberInitial, { color: '#E0C94A' }]}>✉</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.teamMemberName, { color: t.text }]}>{inv.email}</Text>
                            <Text style={[styles.teamMemberEmail, { color: t.textMuted }]}>Sent {inv.sentAt}</Text>
                          </View>
                          <View style={[styles.teamRoleBadge, { backgroundColor: 'rgba(224,201,74,0.12)' }]}>
                            <Text style={[styles.teamRoleText, { color: '#E0C94A' }]}>Pending</Text>
                          </View>
                          <Pressable
                            onPress={() => Share.share({
                              message: `You're invited to join "${team.name}" on InTrackLog: https://intracklog.com/accept-invite?token=${inv.token}`,
                            }).catch(() => {})}
                            hitSlop={10}
                            style={[styles.reimbBtn, { borderColor: t.accent, marginLeft: 8 }]}
                          >
                            <Text style={[styles.reimbBtnText, { color: t.accent }]}>Share link</Text>
                          </Pressable>
                          <Pressable onPress={() => handleCancelInvite(team.id, inv.id)} hitSlop={10} style={{ marginLeft: 8 }}>
                            <Text style={{ color: t.textGrey, fontSize: 14 }}>✕</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Reimbursement claims tab (admins see submitted claims) */}
                  {teamInnerTab === 'reimbursements' && (
                    <View style={[styles.teamCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                      <View style={styles.teamMembersHeader}>
                        <Text style={[styles.teamMembersTitle, { color: t.text }]}>Reimbursement claims</Text>
                      </View>
                      {teamReports.length === 0 && (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                          <Text style={[styles.locEmptyText, { color: t.textMuted }]}>No claims submitted yet. Members submit from Reports → Reconcile.</Text>
                        </View>
                      )}
                      {teamReports.map((r) => {
                        const sc = r.status === 'approved' ? t.accent : r.status === 'rejected' ? t.error : r.status === 'paid' ? '#5DCAA5' : t.info;
                        const isTeamAdmin = !!user && team.ownerId === user.id;
                        return (
                          <View key={r.id} style={[styles.teamMemberRow, { borderTopColor: t.border }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.teamMemberName, { color: t.text }]}>{r.submitter_name || 'Member'} · {r.period_label}</Text>
                              <Text style={[styles.teamMemberEmail, { color: t.textMuted }]}>{r.business_km.toFixed(1)} km · R {r.amount.toFixed(2)}</Text>
                            </View>
                            {isTeamAdmin && r.status === 'submitted' ? (
                              <>
                                <Pressable onPress={() => handleReimbursementAction(r.id, 'approved')} style={[styles.reimbBtn, { borderColor: t.accent }]}>
                                  <Text style={[styles.reimbBtnText, { color: t.accent }]}>Approve</Text>
                                </Pressable>
                                <Pressable onPress={() => handleReimbursementAction(r.id, 'rejected')} style={[styles.reimbBtn, { borderColor: t.error }]}>
                                  <Text style={[styles.reimbBtnText, { color: t.error }]}>Reject</Text>
                                </Pressable>
                              </>
                            ) : isTeamAdmin && r.status === 'approved' ? (
                              <Pressable onPress={() => handleReimbursementAction(r.id, 'paid')} style={[styles.reimbBtn, { borderColor: '#5DCAA5' }]}>
                                <Text style={[styles.reimbBtnText, { color: '#5DCAA5' }]}>Mark paid</Text>
                              </Pressable>
                            ) : (
                              <View style={[styles.teamRoleBadge, { backgroundColor: sc + '22' }]}>
                                <Text style={[styles.teamRoleText, { color: sc, textTransform: 'capitalize' }]}>{r.status}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        )}
      </ScrollView>
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modal, { backgroundColor: t.surface2 }]} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
            <View style={[styles.modalHandle, { backgroundColor: t.border }]} />
            <Text style={[styles.modalTitle, { color: t.text }]}>Add a vehicle</Text>
            <Input label="Licence plate number" value={newPlate} onChangeText={setNewPlate} placeholder="e.g. CA 456-789" autoCapitalize="characters" />
            <Input label="Description" value={newDesc} onChangeText={setNewDesc} placeholder="e.g. Toyota Hilux 2.4 GD-6" />
            <Input label="Current mileage (km)" value={newMileage} onChangeText={setNewMileage} placeholder="e.g. 45 230" keyboardType="numeric" />
            <Button title="Add vehicle" onPress={handleAddVehicle} />
            <Pressable onPress={() => setShowModal(false)} style={styles.cancelBtn}><Text style={[styles.cancelText, { color: t.textMuted }]}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showLocModal} transparent animationType="fade">
        <Pressable style={styles.centreOverlay} onPress={() => setShowLocModal(false)}>
          <Pressable style={[styles.centreModal, { backgroundColor: t.surface2, borderColor: t.border }]} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Save a location</Text>
            <Input label="Location name" value={locName} onChangeText={setLocName} placeholder="e.g. Head Office" />
            <Input label="Address" value={locAddress} onChangeText={setLocAddress} placeholder="e.g. 123 Main Rd, Sandton" />
            <Input label="City" value={locCity} onChangeText={setLocCity} placeholder="e.g. Johannesburg" />
            <Input label="Country" value={locCountry} onChangeText={setLocCountry} placeholder="e.g. South Africa" />
            <Button title="Save location" onPress={handleAddLocation} />
            <Pressable onPress={() => setShowLocModal(false)} style={styles.cancelBtn}><Text style={[styles.cancelText, { color: t.textMuted }]}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showTeamModal} transparent animationType="fade">
        <Pressable style={styles.centreOverlay} onPress={() => setShowTeamModal(false)}>
          <Pressable style={[styles.centreModal, { backgroundColor: t.surface2, borderColor: t.border }]} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Create a team</Text>
            <Input label="Team name" value={teamName} onChangeText={setTeamName} placeholder="e.g. Sales Team" />
            <Input label="Workplace name" value={teamWorkplace} onChangeText={setTeamWorkplace} placeholder="e.g. Head Office" />
            <Input label="Workplace address" value={teamWorkplaceAddr} onChangeText={setTeamWorkplaceAddr} placeholder="e.g. 45 Commissioner St, Johannesburg" />
            <Button title="Next" onPress={handleTeamStep1} />
            <Pressable onPress={() => setShowTeamModal(false)} style={styles.cancelBtn}><Text style={[styles.cancelText, { color: t.textMuted }]}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showMemberModal} transparent animationType="fade">
        <Pressable style={styles.centreOverlay} onPress={() => setShowMemberModal(false)}>
          <Pressable style={[styles.centreModal, { backgroundColor: t.surface2, borderColor: t.border }]} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Add team member</Text>
            <Input label="Full name" value={memberName} onChangeText={setMemberName} placeholder="e.g. John Doe" />
            <Input label="Email" value={memberEmail} onChangeText={setMemberEmail} placeholder="e.g. john@company.co.za" keyboardType="email-address" autoCapitalize="none" />
            <Text style={[styles.teamRoleLabel, { color: t.textMuted }]}>Role</Text>
            <View style={styles.teamRoleRow}>
              <Pressable onPress={() => setMemberRole('member')} style={[styles.teamRoleOption, { backgroundColor: memberRole === 'member' ? t.accent : t.surface, borderColor: memberRole === 'member' ? t.accent : t.border }]}>
                <Text style={[styles.teamRoleOptionText, { color: memberRole === 'member' ? '#ffffff' : t.text }]}>Member</Text>
              </Pressable>
              <Pressable onPress={() => setMemberRole('admin')} style={[styles.teamRoleOption, { backgroundColor: memberRole === 'admin' ? t.secondary : t.surface, borderColor: memberRole === 'admin' ? t.secondary : t.border }]}>
                <Text style={[styles.teamRoleOptionText, { color: memberRole === 'admin' ? '#ffffff' : t.text }]}>Admin</Text>
              </Pressable>
            </View>
            <Button title="Add member" onPress={handleAddMember} />
            <Pressable onPress={() => setShowMemberModal(false)} style={styles.cancelBtn}><Text style={[styles.cancelText, { color: t.textMuted }]}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showRateModal} transparent animationType="fade">
        <Pressable style={styles.centreOverlay} onPress={() => {}}>
          <View style={[styles.centreModal, { backgroundColor: t.surface2, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Overall team rate</Text>
            <Text style={[styles.rptDateRange, { color: t.textMuted, marginBottom: 16 }]}>Set a mileage reimbursement rate for this team.</Text>

            {(['standard', 'custom', 'none'] as RateType[]).map((rate) => (
              <Pressable key={rate} onPress={() => setTeamRateType(rate)} style={[styles.teamRateOption, { backgroundColor: teamRateType === rate ? t.accentBg : t.surface, borderColor: teamRateType === rate ? t.accent : t.border }]}>
                <View style={[styles.teamRateRadio, { borderColor: teamRateType === rate ? t.accent : t.textMuted }]}>
                  {teamRateType === rate && <View style={[styles.teamRateRadioFill, { backgroundColor: t.accent }]} />}
                </View>
                <View>
                  <Text style={[styles.teamRateLabel, { color: t.text }]}>
                    {rate === 'standard' ? 'Standard' : rate === 'custom' ? 'Custom' : 'None'}
                  </Text>
                  <Text style={[styles.teamRateDesc, { color: t.textMuted }]}>
                    {rate === 'standard' ? 'SARS rate of R 4.64/km' : rate === 'custom' ? 'Set your own rate per km' : 'No reimbursement rate'}
                  </Text>
                </View>
              </Pressable>
            ))}

            {teamRateType === 'custom' && (
              <Input label="Custom rate (R per km)" value={teamCustomRate} onChangeText={setTeamCustomRate} placeholder="e.g. 3.50" keyboardType="decimal-pad" />
            )}

            <View style={{ marginTop: 12 }}>
              <Button title="Create team" onPress={() => handleTeamStep2()} />
            </View>
            <Pressable onPress={() => handleTeamStep2(true)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: t.textMuted }]}>Skip</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <Modal visible={showInviteModal} transparent animationType="fade">
        <Pressable style={styles.centreOverlay} onPress={() => setShowInviteModal(false)}>
          <Pressable style={[styles.centreModal, { backgroundColor: t.surface2, borderColor: t.border }]} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Send invitation</Text>
            <Text style={[styles.rptDateRange, { color: t.textMuted, marginBottom: 12 }]}>Invite a team member by email. They'll receive an invitation to join and start logging trips.</Text>
            <Input label="Email address" value={inviteEmail} onChangeText={setInviteEmail} placeholder="e.g. colleague@company.co.za" keyboardType="email-address" autoCapitalize="none" />
            <Button title="Send invite" onPress={handleSendInvite} />
            <Pressable onPress={() => setShowInviteModal(false)} style={styles.cancelBtn}><Text style={[styles.cancelText, { color: t.textMuted }]}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      {/* Payment modal — in-app card details form */}
      <Modal visible={showPayment} transparent animationType="fade">
        <Pressable style={styles.centreOverlay} onPress={() => setShowPayment(false)}>
          <Pressable style={[styles.paymentModal, { backgroundColor: t.surface2, borderColor: t.border }]} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
            <Text style={[styles.paymentTitle, { color: t.text }]}>Complete payment</Text>

            {/* Selected plan summary */}
            {paymentTier && (
              <View style={[styles.paymentPlanCard, { backgroundColor: t.accentBg, borderColor: t.accentBorder }]}>
                <View style={styles.paymentPlanRow}>
                  <Text style={[styles.paymentPlanName, { color: t.text }]}>{paymentTier.name} Plan</Text>
                  <Text style={[styles.paymentPlanPrice, { color: paymentTier.color }]}>{paymentTier.price}{paymentTier.period}</Text>
                </View>
                <Text style={[styles.paymentPlanBilled, { color: t.textMuted }]}>Billed monthly. Cancel anytime.</Text>
              </View>
            )}

            <Text style={[styles.paymentSectionLabel, { color: t.textMuted }]}>Card details</Text>
            <Input label="Cardholder name" value={cardName} onChangeText={setCardName} placeholder="Name on card" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
            <Input label="Card number" value={cardNumber} onChangeText={(v) => {
              const cleaned = v.replace(/\D/g, '').slice(0, 16);
              setCardNumber(cleaned.replace(/(.{4})/g, '$1 ').trim());
            }} placeholder="0000 0000 0000 0000" keyboardType="numeric" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
            <View style={styles.paymentCardRow}>
              <View style={{ flex: 1 }}>
                <Input label="Expiry" value={cardExpiry} onChangeText={(v) => {
                  const cleaned = v.replace(/\D/g, '').slice(0, 4);
                  setCardExpiry(cleaned.length > 2 ? cleaned.slice(0, 2) + '/' + cleaned.slice(2) : cleaned);
                }} placeholder="MM/YY" keyboardType="numeric" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="CVV" value={cardCvv} onChangeText={(v) => setCardCvv(v.replace(/\D/g, '').slice(0, 3))} placeholder="123" keyboardType="numeric" secureTextEntry returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
              </View>
            </View>

            <Button title={`Pay ${paymentTier?.price || ''}`} onPress={() => {
              Keyboard.dismiss();
              if (!cardName || !cardNumber || !cardExpiry || !cardCvv) { toast.show('Please fill in all card details.'); return; }
              if (cardNumber.replace(/\s/g, '').length < 16) { toast.show('Please enter a valid card number.'); return; }
              if (cardCvv.length < 3) { toast.show('Please enter a valid CVV.'); return; }
              if (!user || !paymentTier) { toast.show('Unable to process — try again.'); return; }
              const amount = Number(paymentTier.price.replace(/[^\d.]/g, '')) || 0;
              const html = buildPayFastCheckoutHTML({
                amount,
                itemName: `InTrackLog ${paymentTier.name} Plan`,
                itemDescription: `Monthly subscription — ${paymentTier.name} tier`,
                email: user.email,
                firstName: cardName.split(' ')[0] || (user.full_name || '').split(' ')[0] || 'User',
                lastName: cardName.split(' ').slice(1).join(' ') || (user.full_name || '').split(' ').slice(1).join(' '),
                customerId: user.id,
                tierKey: paymentTier.key,
                returnUrl: 'https://intracklog.com/payment-success',
                cancelUrl: 'https://intracklog.com/payment-cancel',
                notifyUrl: 'https://intracklog.com/api/payfast-ipn',
              }, !PAYFAST_SANDBOX); // Disable recurring in sandbox to avoid public sandbox limits
              if (Platform.OS === 'web') {
                // On web, open PayFast checkout in a new tab via form post
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); }
                else { toast.show('Please allow popups for payment.'); return; }
                setShowPayment(false);
              } else {
                setShowPayment(false);
                setPaymentWebViewHtml(html);
              }
            }} />

            <View style={styles.paymentSecure}>
              <Text style={[styles.paymentSecureText, { color: t.textGrey }]}>🔒 Secure payment via PayFast. Your card details are encrypted.</Text>
            </View>

            <Pressable onPress={() => setShowPayment(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: t.textMuted }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      {/* PayFast WebView checkout */}
      <Modal visible={!!paymentWebViewHtml} animationType="slide">
        <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
          <View style={[styles.payfastHeader, { borderBottomColor: t.border }]}>
            <Pressable onPress={() => setPaymentWebViewHtml('')} hitSlop={10}>
              <Text style={[styles.payfastClose, { color: t.accent }]}>← Cancel</Text>
            </Pressable>
            <Text style={[styles.payfastTitle, { color: t.text }]}>
              {paymentTier ? `${paymentTier.name} — ${paymentTier.price}/month` : 'PayFast'}
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <WebView
            source={{ html: paymentWebViewHtml, baseUrl: 'https://sandbox.payfast.co.za/' }}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            onNavigationStateChange={async (navState) => {
              if (navState.url.includes('payment-success')) {
                if (paymentTier) {
                  setSelectedTier(paymentTier.key);
                  await apiUpdateSettings({ subscription_tier: paymentTier.key }).catch(() => {});
                }
                setPaymentWebViewHtml('');
                setShowPayment(false);
                setCardName(''); setCardNumber(''); setCardExpiry(''); setCardCvv('');
                toast.show(`Subscribed to ${paymentTier?.name} plan!`);
              } else if (navState.url.includes('payment-cancel')) {
                setPaymentWebViewHtml('');
                toast.show('Payment cancelled');
              }
            }}
            startInLoadingState
            renderLoading={() => (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
                <ActivityIndicator size="large" color={t.accent} />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
      {/* Driversnote-style slide-out sidebar */}
      {slidePanel !== 'none' && (
        <View style={styles.sidebarOverlay}>
          <Pressable style={styles.sidebarBackdrop} onPress={() => setSlidePanel('none')} />
          <View style={[styles.sidebar, { backgroundColor: t.surface2, borderColor: t.border }]}>
            <View>
              {/* Sidebar header */}
              <View style={[styles.sidebarHeader, { borderBottomColor: t.border }]}>
                {slidePanel === 'settings' && settingsTab !== 'main' ? (
                  <Pressable onPress={() => setSettingsTab('main')} hitSlop={10}>
                    <Text style={[styles.sidebarBackBtn, { color: t.accent }]}>←</Text>
                  </Pressable>
                ) : <View style={{ width: 24 }} />}
                <Text style={[styles.sidebarTitle, { color: t.text }]}>
                  {slidePanel === 'editAccount' ? 'Edit Account' :
                    settingsTab === 'main' ? 'Settings' : settingsTab === 'vehicles' ? 'Vehicles' : settingsTab === 'workplace' ? 'Workplace' : settingsTab === 'rate' ? 'Mileage Rate' : settingsTab === 'odometer' ? 'Odometer' : settingsTab === 'notifications' ? 'Notifications' : 'Generate Report'}
                </Text>
                <Pressable onPress={() => setSlidePanel('none')} hitSlop={10}>
                  <Text style={[styles.sidebarClose, { color: t.textMuted }]}>✕</Text>
                </Pressable>
              </View>

              {/* Navigation tabs when in Edit Account */}
              {slidePanel === 'editAccount' && (
                <View style={[styles.sidebarNav, { borderBottomColor: t.border }]}>
                  <Pressable onPress={() => setEditAccountTab('subscription')} style={[styles.sidebarNavItem, editAccountTab === 'subscription' && styles.sidebarNavItemActive, editAccountTab === 'subscription' && { borderBottomColor: t.accent }]}>
                    <Text style={[styles.sidebarNavText, { color: editAccountTab === 'subscription' ? t.accent : t.textMuted }]}>Subscription</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditAccountTab('details')} style={[styles.sidebarNavItem, editAccountTab === 'details' && styles.sidebarNavItemActive, editAccountTab === 'details' && { borderBottomColor: t.accent }]}>
                    <Text style={[styles.sidebarNavText, { color: editAccountTab === 'details' ? t.accent : t.textMuted }]}>Details</Text>
                  </Pressable>
                </View>
              )}

              <ScrollView contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              {/* ===== EDIT ACCOUNT ===== */}
              {slidePanel === 'editAccount' && (
                <View>
                  {editAccountTab === 'subscription' && (
                    <View>
                      {Platform.OS === 'web' ? (
                        <>
                          <Text style={[styles.settingsInfo, { color: t.textMuted }]}>Choose a plan that fits your needs.</Text>
                          {[
                            { key: 'free', name: 'Free', price: 'R 0', period: '/month', features: ['3 vehicles', 'Manual trip logging', 'Basic reports', '30-day history'], color: t.textMuted },
                            { key: 'starter', name: 'Starter', price: 'R 75', period: '/month', features: ['5 vehicles', 'GPS trip tracking', 'Expense tracking', 'Full history', 'PDF reports'], color: t.info },
                            { key: 'pro', name: 'Pro', price: 'R 99', period: '/month', features: ['10 vehicles', 'GPS trip tracking', 'Teams (up to 5)', 'Custom mileage rates', 'Advanced reports', 'Priority support'], color: t.accent },
                            { key: 'business', name: 'Business', price: 'R 249', period: '/month', features: ['Unlimited vehicles', 'Unlimited teams', 'Admin dashboard', 'Bulk reporting', 'API access', 'Dedicated support', 'Custom branding'], color: t.secondary },
                          ].map((tier) => {
                            const isSelected = selectedTier === tier.key;
                            return (
                              <Pressable key={tier.key} onPress={() => {
                                if (tier.key === 'free') { setSelectedTier('free'); apiUpdateSettings({ subscription_tier: 'free' }).catch(() => {}); toast.show('Switched to Free plan'); return; }
                                if (isSelected) return;
                                setPaymentTier(tier); setCardNumber(''); setCardExpiry(''); setCardCvv(''); setCardName(''); setShowPayment(true);
                              }} style={[styles.tierCard, { borderColor: isSelected ? tier.color : t.border, backgroundColor: t.surface }]}>
                                <View style={styles.tierHeader}>
                                  <View>
                                    <Text style={[styles.tierName, { color: t.text }]}>{tier.name}</Text>
                                    <View style={styles.tierPriceRow}>
                                      <Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
                                      <Text style={[styles.tierPeriod, { color: t.textMuted }]}>{tier.period}</Text>
                                    </View>
                                  </View>
                                  {isSelected && (
                                    <View style={[styles.tierActiveBadge, { backgroundColor: tier.color }]}>
                                      <Text style={styles.tierActiveText}>Current</Text>
                                    </View>
                                  )}
                                </View>
                                <View style={[styles.tierDivider, { backgroundColor: t.border }]} />
                                {tier.features.map((f, i) => (
                                  <View key={i} style={styles.tierFeatureRow}>
                                    <Text style={[styles.tierCheck, { color: tier.color }]}>✓</Text>
                                    <Text style={[styles.tierFeature, { color: t.text }]}>{f}</Text>
                                  </View>
                                ))}
                              </Pressable>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <Text style={[styles.settingsInfo, { color: t.textMuted }]}>Your current plan</Text>
                          <View style={[styles.tierCard, { borderColor: t.border, backgroundColor: t.surface, marginTop: 8 }]}>
                            <View style={styles.tierHeader}>
                              <Text style={[styles.tierName, { color: t.text }]}>{selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Plan</Text>
                              <View style={[styles.tierActiveBadge, { backgroundColor: t.accent }]}>
                                <Text style={styles.tierActiveText}>Current</Text>
                              </View>
                            </View>
                          </View>
                          <Text style={[styles.settingsInfo, { color: t.textMuted, marginTop: 20, lineHeight: 20 }]}>
                            To change your plan, manage your subscription on intracklog.com from any browser.
                          </Text>
                        </>
                      )}
                    </View>
                  )}

                  {editAccountTab === 'details' && (
                    <View style={{ marginTop: 12 }}>
                      <View style={[styles.editAvatarWrap, { borderColor: t.border }]}>
                        <View style={[styles.editAvatar, { backgroundColor: t.accentBg }]}>
                          <Text style={[styles.editAvatarText, { color: t.accent }]}>{(user?.full_name || 'U').charAt(0)}</Text>
                        </View>
                      </View>
                      <Input label="Full name" value={editName} onChangeText={setEditName} placeholder="Your name" />
                      <Input label="Email" value={editEmail} onChangeText={setEditEmail} placeholder="Your email" keyboardType="email-address" autoCapitalize="none" />
                      <Input label="Employee number" value={editEmployeeNo} onChangeText={setEditEmployeeNo} placeholder="e.g. EMP-001234" />

                      <View style={[styles.settingsCard, { backgroundColor: t.surface, borderColor: t.border, marginTop: 8 }]}>
                        <View style={styles.settingsReportRow}>
                          <Text style={[styles.settingsReportLabel, { color: t.textMuted }]}>Account ID</Text>
                          <Text style={[styles.settingsReportValue, { color: t.text, fontSize: 11 }]}>{user?.id?.slice(0, 8) || '—'}...</Text>
                        </View>
                        <View style={styles.settingsReportRow}>
                          <Text style={[styles.settingsReportLabel, { color: t.textMuted }]}>Plan</Text>
                          <Text style={[styles.settingsReportValue, { color: t.accent }]}>{selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}</Text>
                        </View>
                        <View style={styles.settingsReportRow}>
                          <Text style={[styles.settingsReportLabel, { color: t.textMuted }]}>Vehicles</Text>
                          <Text style={[styles.settingsReportValue, { color: t.text }]}>{vehicles.length}</Text>
                        </View>
                      </View>

                      <View style={{ marginTop: 16 }}>
                        <Button title="Save changes" onPress={async () => {
                          await apiUpdateSettings({ employee_number: editEmployeeNo }).catch(() => {});
                          toast.show('Account details saved!');
                        }} />
                      </View>

                      {/* Change password */}
                      <View style={[styles.settingsCard, { backgroundColor: t.surface, borderColor: t.border, marginTop: 20 }]}>
                        <Text style={[styles.settingsCardTitle, { color: t.text, marginBottom: 12 }]}>Change password</Text>
                        <Input label="Current password" value={editCurrentPassword} onChangeText={setEditCurrentPassword} placeholder="Enter current password" secureTextEntry />
                        <Input label="New password" value={editNewPassword} onChangeText={setEditNewPassword} placeholder="Enter new password" secureTextEntry />
                        <Button title="Update password" onPress={async () => {
                          if (!editCurrentPassword || !editNewPassword) { toast.show('Please fill in both password fields.'); return; }
                          if (editNewPassword.length < 6) { toast.show('Password must be at least 6 characters.'); return; }
                          // Verify current password by re-signing in
                          try {
                            const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email || editEmail, password: editCurrentPassword });
                            if (signInError) { toast.show('Current password is incorrect.'); return; }
                            const { error } = await supabase.auth.updateUser({ password: editNewPassword });
                            if (error) throw error;
                            setEditCurrentPassword(''); setEditNewPassword('');
                            toast.show('Password updated successfully!');
                          } catch (e: any) { toast.show(e.message || 'Failed to update password.'); }
                        }} />
                      </View>

                      <Pressable onPress={() => { setSlidePanel('none'); handleLogout(); }} style={[styles.editDeleteBtn, { borderColor: t.error }]}>
                        <Text style={[styles.editDeleteText, { color: t.error }]}>Log out</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* ===== SETTINGS ===== */}
              {slidePanel === 'settings' && (
                <View>
                  {settingsTab === 'main' && (
                    <View>
                      {[
                        { key: 'vehicles' as const, Icon: VehiclesIcon, label: 'Vehicles', desc: 'Manage your registered vehicles' },
                        { key: 'workplace' as const, Icon: WorkplaceIcon, label: 'Workplace', desc: 'Set your default workplace location' },
                        { key: 'rate' as const, Icon: MileageRateIcon, label: 'Mileage Rate', desc: 'Configure reimbursement rate per km' },
                        { key: 'odometer' as const, Icon: OdometerIcon, label: 'Odometer', desc: 'Update current odometer readings' },
                        { key: 'notifications' as const, Icon: GenerateReportIcon, label: 'Notifications', desc: 'Trip reminders and report alerts' },
                        { key: 'report' as const, Icon: GenerateReportIcon, label: 'Generate Report', desc: 'Create and export trip reports' },
                      ].map((item) => (
                        <TouchableOpacity key={item.key} onPress={() => setSettingsTab(item.key)} style={[styles.settingsRow, { borderBottomColor: t.border }]}>
                          <View style={styles.settingsRowIcon}><item.Icon size={20} color={t.textMuted} /></View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.settingsRowLabel, { color: t.text }]}>{item.label}</Text>
                            <Text style={[styles.settingsRowDesc, { color: t.textMuted }]}>{item.desc}</Text>
                          </View>
                          <Text style={[styles.settingsRowArrow, { color: t.textMuted }]}>›</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {settingsTab === 'vehicles' && (
                    <View>
                      {vehicles.map((v) => (
                        <View key={v.id} style={[styles.settingsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                          <Text style={[styles.settingsCardTitle, { color: t.text }]}>{v.description || v.name}</Text>
                          <Text style={[styles.settingsCardSub, { color: t.textMuted }]}>{v.reg_number || 'No plate'}</Text>
                          <Text style={[styles.settingsCardSub, { color: t.textMuted }]}>Odometer: {(v.start_mileage || 0).toLocaleString()} km</Text>
                        </View>
                      ))}
                      <TouchableOpacity onPress={() => { setSlidePanel('none'); setActiveSection('Vehicles'); }} style={[styles.locAddBtn, { borderColor: t.border }]}>
                        <Text style={[styles.locAddIcon, { color: t.accent }]}>+</Text>
                        <Text style={[styles.locAddText, { color: t.textMuted }]}>Add vehicle</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {settingsTab === 'workplace' && (
                    <View>
                      <Input label="Workplace name" value={settingsWorkplaceName} onChangeText={setSettingsWorkplaceName} placeholder="e.g. Head Office" />
                      <Input label="Workplace address" value={settingsWorkplaceAddr} onChangeText={setSettingsWorkplaceAddr} placeholder="e.g. 45 Commissioner St, Johannesburg" />
                      <Button title="Save workplace" onPress={async () => {
                        await apiUpdateSettings({ workplace_name: settingsWorkplaceName, workplace_address: settingsWorkplaceAddr }).catch(() => {});
                        toast.show('Workplace saved!'); setSettingsTab('main');
                      }} />
                    </View>
                  )}

                  {settingsTab === 'rate' && (
                    <View>
                      <Text style={[styles.settingsInfo, { color: t.textMuted }]}>The SARS standard rate is R 4.64 per km.</Text>
                      <Input label="Rate per km (R)" value={settingsRate} onChangeText={setSettingsRate} placeholder="e.g. 4.64" keyboardType="decimal-pad" />
                      <View style={styles.settingsRatePresets}>
                        {['4.64', '3.50', '5.00'].map((r) => (
                          <Pressable key={r} onPress={() => setSettingsRate(r)} style={[styles.settingsRateChip, { backgroundColor: settingsRate === r ? t.accent : t.surface, borderColor: settingsRate === r ? t.accent : t.border }]}>
                            <Text style={[styles.settingsRateChipText, { color: settingsRate === r ? '#fff' : t.text }]}>R {r}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Button title="Save rate" onPress={async () => {
                        await apiUpdateSettings({ mileage_rate: Number(settingsRate) || 4.64 }).catch(() => {});
                        toast.show('Mileage rate saved!'); setSettingsTab('main');
                      }} />
                    </View>
                  )}

                  {settingsTab === 'odometer' && (
                    <View>
                      <Text style={[styles.settingsInfo, { color: t.textMuted }]}>Update the current odometer reading for each vehicle.</Text>
                      {vehicles.map((v) => (
                        <View key={v.id} style={[styles.settingsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                          <Text style={[styles.settingsCardTitle, { color: t.text }]}>{v.description || v.name}</Text>
                          <Text style={[styles.settingsCardSub, { color: t.textMuted }]}>{v.reg_number || ''}</Text>
                          <View style={{ marginTop: 8 }}>
                            <Input label="Current reading (km)" value={String(v.start_mileage || 0)} onChangeText={(val) => {
                              const num = Number(val) || 0;
                              useVehicleStore.getState().updateVehicle(v.id, { start_mileage: num }).catch(() => {});
                            }} keyboardType="numeric" />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {settingsTab === 'notifications' && (
                    <View>
                      <Text style={[styles.settingsInfo, { color: t.textMuted }]}>Choose which reminders you'd like to receive.</Text>
                      <Pressable onPress={async () => {
                        const next = !notifTripReminders;
                        setNotifTripReminders(next);
                        if (next) await scheduleDailyTripReminder(18, 0); else await cancelTripReminders();
                        toast.show(next ? 'Daily trip reminders enabled' : 'Daily reminders disabled');
                      }} style={[styles.settingsCard, { backgroundColor: t.surface, borderColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.settingsCardTitle, { color: t.text }]}>Daily trip reminder</Text>
                          <Text style={[styles.settingsCardSub, { color: t.textMuted }]}>6:00 PM — log today's trips</Text>
                        </View>
                        <View style={[styles.toggleTrack, { backgroundColor: notifTripReminders ? t.accent : t.surface2 }]}>
                          <View style={[styles.toggleThumb, { transform: [{ translateX: notifTripReminders ? 14 : 2 }] }]} />
                        </View>
                      </Pressable>
                      <Pressable onPress={async () => {
                        const next = !notifMonthlyReport;
                        setNotifMonthlyReport(next);
                        if (next) await scheduleMonthlyReportReminder(); else await cancelAllNotifications();
                        toast.show(next ? 'Monthly report reminders enabled' : 'Monthly reminders disabled');
                      }} style={[styles.settingsCard, { backgroundColor: t.surface, borderColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.settingsCardTitle, { color: t.text }]}>Monthly report reminder</Text>
                          <Text style={[styles.settingsCardSub, { color: t.textMuted }]}>1st of every month — generate report</Text>
                        </View>
                        <View style={[styles.toggleTrack, { backgroundColor: notifMonthlyReport ? t.accent : t.surface2 }]}>
                          <View style={[styles.toggleThumb, { transform: [{ translateX: notifMonthlyReport ? 14 : 2 }] }]} />
                        </View>
                      </Pressable>
                      <View style={{ marginTop: 12 }}>
                        <Button title="Send test notification" variant="secondary" onPress={async () => {
                          await sendTestNotification();
                          toast.show('Test notification sent');
                        }} />
                      </View>
                    </View>
                  )}

                  {settingsTab === 'report' && (
                    <View>
                      <Text style={[styles.settingsInfo, { color: t.textMuted }]}>Generate a trip report for a selected period.</Text>
                      <View style={[styles.settingsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                        <Text style={[styles.settingsCardTitle, { color: t.text }]}>Report summary</Text>
                        <View style={[styles.settingsReportRow, { borderBottomColor: t.border }]}>
                          <Text style={[styles.settingsReportLabel, { color: t.textMuted }]}>Total trips</Text>
                          <Text style={[styles.settingsReportValue, { color: t.text }]}>{allEntries.filter((e) => e.trip_km && e.trip_km > 0).length}</Text>
                        </View>
                        <View style={[styles.settingsReportRow, { borderBottomColor: t.border }]}>
                          <Text style={[styles.settingsReportLabel, { color: t.textMuted }]}>Total distance</Text>
                          <Text style={[styles.settingsReportValue, { color: t.accent }]}>{allEntries.reduce((s, e) => s + (e.trip_km || 0), 0).toLocaleString()} km</Text>
                        </View>
                        <View style={styles.settingsReportRow}>
                          <Text style={[styles.settingsReportLabel, { color: t.textMuted }]}>Total expenses</Text>
                          <Text style={[styles.settingsReportValue, { color: t.secondary }]}>R {allEntries.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}</Text>
                        </View>
                      </View>
                      <Button title="Download PDF report" onPress={async () => {
                        try {
                          await exportReportPDF({
                            user: { name: user?.full_name || 'Driver', email: user?.email || '', employeeNumber: editEmployeeNo },
                            entries: allEntries, vehicles, mileageRate: Number(settingsRate) || 4.64,
                          });
                          toast.show('Report ready to share');
                        } catch (e: any) { toast.show(e.message || 'Failed to generate PDF'); }
                      }} />
                      <View style={{ marginTop: 10 }}>
                        <Button title="Download CSV (Excel)" variant="secondary" onPress={async () => {
                          try {
                            await exportReportCSV({
                              user: { name: user?.full_name || 'Driver', email: user?.email || '', employeeNumber: editEmployeeNo },
                              entries: allEntries, vehicles, mileageRate: Number(settingsRate) || 4.64,
                            });
                            toast.show('CSV exported');
                          } catch (e: any) { toast.show(e.message || 'Failed to export CSV'); }
                        }} />
                      </View>
                      <View style={{ marginTop: 10 }}>
                        <Button title="Export all my data (JSON)" variant="secondary" onPress={async () => {
                          try {
                            await exportAllData({
                              user: { name: user?.full_name || 'Driver', email: user?.email || '', employeeNumber: editEmployeeNo },
                              entries: allEntries, vehicles, mileageRate: Number(settingsRate) || 4.64,
                              locations: savedLocations, teams,
                              settings: { mileageRate: settingsRate, workplaceName: settingsWorkplaceName, workplaceAddr: settingsWorkplaceAddr, subscriptionTier: selectedTier },
                            });
                            toast.show('Data exported');
                          } catch (e: any) { toast.show(e.message || 'Failed to export'); }
                        }} />
                      </View>
                      <View style={{ marginTop: 10 }}>
                        <Button title="View report on dashboard" variant="secondary" onPress={() => { setSlidePanel('none'); setActiveSection('Trips'); }} />
                      </View>
                    </View>
                  )}
                </View>
              )}
              </ScrollView>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, zIndex: 10 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTrack: { width: 34, height: 20, borderRadius: 10, justifyContent: 'center' },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.5, elevation: 2 },
  accountBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  accountText: { fontFamily: 'DMSans-Medium', fontSize: 12 },
  accountArrow: { fontSize: 8 },
  dropdown: { position: 'absolute', top: 36, right: 0, borderWidth: 1, borderRadius: 12, minWidth: 150, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, zIndex: 100 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
  dropdownText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  dropdownDivider: { height: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: '8%', paddingVertical: 24, paddingBottom: 40 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  gridBtn: { borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  gridLabel: { fontFamily: 'DMSans-Medium', letterSpacing: 0.2 },
  // Home section — GlobalRide-style tiles
  homeSection: { width: '100%', marginTop: 24 },
  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tileRow3: { flexDirection: 'row', gap: 8, marginBottom: 12, justifyContent: 'center', flexWrap: 'wrap' },
  tile: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 18 },
  tile3: { borderWidth: 1, borderRadius: 22, padding: 20 },
  tileCalendar: { borderWidth: 1, borderRadius: 22, padding: 20, overflow: 'hidden' },
  tileFull: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 12 },
  tileHeader: { fontFamily: 'DMSans-Medium', fontSize: 12, letterSpacing: 0.3, marginBottom: 10 },
  tileBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tileBigNum: { fontFamily: 'DMSans-Bold', fontSize: 28, letterSpacing: -1 },
  tileNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tileSuffix: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  tileArrow: { fontSize: 22 },
  chartWrap: { marginTop: 10, alignItems: 'center' },
  // Vehicle comparison bars
  vehicleBars: { marginTop: 14, gap: 10 },
  vehicleBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleBarLabel: { fontFamily: 'DMSans-Regular', fontSize: 12, width: 70 },
  vehicleBarTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  vehicleBarFill: { height: 10, borderRadius: 5 },
  // Current vehicle
  currentVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  currentVehicleBadge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  currentVehicleLetter: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  currentVehicleInfo: { flex: 1 },
  currentVehicleName: { fontFamily: 'DMSans-Bold', fontSize: 16, marginBottom: 6 },
  currentVehicleDetails: { flexDirection: 'row', gap: 8 },
  detailChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  detailChipText: { fontFamily: 'DMSans-Medium', fontSize: 11 },
  // Schedule of trips
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1 },
  scheduleVehicle: { flex: 1, fontFamily: 'DMSans-Medium', fontSize: 12 },
  scheduleKm: { fontFamily: 'DMSans-Regular', fontSize: 11, minWidth: 45 },
  scheduleDate: { fontFamily: 'DMSans-Regular', fontSize: 11, minWidth: 75 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 50 },
  statusText: { fontFamily: 'DMSans-Medium', fontSize: 10 },
  // Calendar
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  calDayLabel: { width: 40, height: 18, textAlign: 'center', fontFamily: 'DMSans-Bold', fontSize: 11 },
  calCell: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center' },
  calDayNum: { fontFamily: 'DMSans-Regular', fontSize: 11 },
  calLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontFamily: 'DMSans-Regular', fontSize: 9 },
  // Odometer tile
  odoDisplay: { borderWidth: 2, borderRadius: 12, padding: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  odoCasing: { borderWidth: 1.5, borderRadius: 6, padding: 3, width: '100%', alignItems: 'center' },
  odoDigits: { flexDirection: 'row', gap: 1.5, width: '100%' },
  odoDigitBox: { flex: 1, height: 28, borderRadius: 3, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 1, elevation: 2 },
  odoDigitText: { fontFamily: 'DMSans-Bold', fontSize: 14, lineHeight: 20 },
  odoKmLabel: { fontFamily: 'DMSans-Bold', fontSize: 11, color: '#8a8a96', marginTop: 8, letterSpacing: 4, textTransform: 'uppercase' },
  odoTopLine: { width: '90%', height: 1, marginBottom: 6, borderRadius: 0.5 },
  odoBottomLine: { width: '90%', height: 1, marginTop: 6, borderRadius: 0.5 },
  odoVehicle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  odoVehicleDot: { width: 6, height: 6, borderRadius: 3 },
  odoVehicleName: { fontFamily: 'DMSans-Medium', fontSize: 11, flex: 1 },
  odoPlate: { fontFamily: 'DMSans-Regular', fontSize: 9, marginTop: 2 },
  odoDate: { fontFamily: 'DMSans-Regular', fontSize: 8, marginTop: 2 },
  // Quick start
  quickStart: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 10 },
  quickStartText: { fontFamily: 'DMSans-Bold', fontSize: 15, color: '#ffffff' },
  tripMobileNote: { fontFamily: 'DMSans-Regular', fontSize: 12, textAlign: 'center', marginBottom: 8, fontStyle: 'italic' },
  tripPickerList: { borderWidth: 1, borderRadius: 12, padding: 4, marginTop: -4, marginBottom: 10 },
  tripPickerTitle: { fontFamily: 'DMSans-Medium', fontSize: 11, paddingHorizontal: 12, paddingVertical: 8 },
  tripPickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 1 },
  tripPickerName: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  tripPickerPlate: { fontFamily: 'DMSans-Regular', fontSize: 12 },
  // Trip report — Driversnote style
  tripReport: { marginTop: 12 },
  rptTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, letterSpacing: -0.5, marginBottom: 4 },
  rptDateRange: { fontFamily: 'DMSans-Regular', fontSize: 13, marginBottom: 24 },
  rptSectionTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 22, marginBottom: 12 },
  rptSumTable: { marginBottom: 28 },
  rptSumRow: { flexDirection: 'row', paddingVertical: 8 },
  rptSumHead: { fontFamily: 'DMSans-Bold', fontSize: 11, letterSpacing: 0.3 },
  rptSumCell: { fontFamily: 'DMSans-Regular', fontSize: 13 },
  rptSumTotal: { fontFamily: 'DMSans-Bold', fontSize: 13, paddingTop: 4 },
  // Individual trip entry
  rptEntry: { paddingBottom: 16, marginBottom: 16, borderBottomWidth: 2.5 },
  rptEntryDate: { fontFamily: 'DMSans-Medium', fontSize: 11, marginBottom: 8 },
  rptRouteWrap: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  rptTimeline: { alignItems: 'center', width: 12, paddingVertical: 3 },
  rptDotHollow: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, backgroundColor: 'transparent' },
  rptTimelineLine: { width: 1.5, flex: 1, marginVertical: 3 },
  rptDotFilled: { width: 9, height: 9, borderRadius: 4.5 },
  rptLocations: { flex: 1, justifyContent: 'space-between', paddingVertical: 1 },
  rptLocText: { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 18 },
  rptMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 22 },
  rptMetaBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
  rptMetaBadgeText: { fontFamily: 'DMSans-Medium', fontSize: 11 },
  rptMetaVal: { fontFamily: 'DMSans-Regular', fontSize: 12 },
  // Locations section
  locSection: { marginTop: 12 },
  locEmpty: { borderWidth: 1, borderRadius: 16, padding: 28, alignItems: 'center', gap: 12 },
  locEmptyText: { fontFamily: 'DMSans-Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  locCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  locHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  locPin: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locInfo: { flex: 1 },
  locName: { fontFamily: 'DMSans-Bold', fontSize: 15, letterSpacing: -0.2 },
  locLastVisit: { fontFamily: 'DMSans-Regular', fontSize: 11, marginTop: 2 },
  locStats: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
  locStatItem: { flex: 1, alignItems: 'center' },
  locStatDivider: { width: 1, marginHorizontal: 4 },
  locStatValue: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  locStatLabel: { fontFamily: 'DMSans-Regular', fontSize: 10, marginTop: 2 },
  locVehicles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  locDescText: { fontFamily: 'DMSans-Regular', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  locAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginBottom: 8 },
  locAddIcon: { fontSize: 20, fontFamily: 'DMSans-Bold' },
  locAddText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  locVehicleChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  locVehicleChipText: { fontFamily: 'DMSans-Medium', fontSize: 10 },
  // Teams section
  teamSection: { marginTop: 12 },
  teamDropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  teamDropdownText: { fontFamily: 'DMSans-Bold', fontSize: 15 },
  teamDropdownList: { position: 'absolute', top: 50, left: 0, right: 0, borderWidth: 1, borderRadius: 12, zIndex: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  teamDropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
  teamDropdownItemText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  teamRateOption: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  teamRateRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  teamRateRadioFill: { width: 10, height: 10, borderRadius: 5 },
  teamRateLabel: { fontFamily: 'DMSans-Bold', fontSize: 14 },
  teamRateDesc: { fontFamily: 'DMSans-Regular', fontSize: 11, marginTop: 2 },
  teamInfoBar: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 4 },
  teamTabBar: { flexDirection: 'row', gap: 4, marginBottom: 12, justifyContent: 'flex-start' },
  teamTab: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  teamTabText: { fontFamily: 'DMSans-Bold', fontSize: 13 },
  teamCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  teamHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14 },
  teamIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teamName: { fontFamily: 'DMSans-Bold', fontSize: 16 },
  teamCreated: { fontFamily: 'DMSans-Regular', fontSize: 10, marginTop: 2 },
  teamWorkplace: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  teamWorkplaceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  teamWorkplaceLabel: { fontFamily: 'DMSans-Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  teamWorkplaceName: { fontFamily: 'DMSans-Bold', fontSize: 14, marginBottom: 2 },
  teamWorkplaceAddr: { fontFamily: 'DMSans-Regular', fontSize: 12 },
  teamMembersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  teamMembersTitle: { fontFamily: 'DMSans-Bold', fontSize: 13 },
  teamAddMemberBtn: { fontFamily: 'DMSans-Bold', fontSize: 13 },
  teamMemberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  teamMemberAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  teamMemberInitial: { fontFamily: 'DMSans-Bold', fontSize: 14 },
  teamMemberName: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  teamMemberEmail: { fontFamily: 'DMSans-Regular', fontSize: 10, marginTop: 1 },
  teamRoleBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 50 },
  teamRoleText: { fontFamily: 'DMSans-Medium', fontSize: 10 },
  reimbBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 7, borderWidth: 1, marginLeft: 6 },
  reimbBtnText: { fontFamily: 'DMSans-Bold', fontSize: 11 },
  teamStats: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12, marginTop: 10 },
  teamRoleLabel: { fontFamily: 'DMSans-Medium', fontSize: 12, marginBottom: 8, letterSpacing: 0.3 },
  teamRoleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  teamRoleOption: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  teamRoleOptionText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  // Vehicles section
  heading: { fontFamily: 'InstrumentSerif-Regular', fontSize: 32, marginBottom: 4, marginTop: 12 },
  headingAccent: { fontFamily: 'InstrumentSerif-Italic' },
  sub: { fontFamily: 'DMSans-Regular', fontSize: 13, marginBottom: 20 },
  list: { gap: 14, marginBottom: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 32, paddingTop: 16 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 24, marginBottom: 20, textAlign: 'center' },
  // Edit Account
  editAccountTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  editAccountTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  editAccountTabText: { fontFamily: 'DMSans-Bold', fontSize: 13 },
  tierCard: { borderWidth: 1.5, borderRadius: 16, padding: 18, marginBottom: 14 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tierName: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  tierPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
  tierPrice: { fontFamily: 'DMSans-Bold', fontSize: 22 },
  tierPeriod: { fontFamily: 'DMSans-Regular', fontSize: 12 },
  tierActiveBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  tierActiveText: { fontFamily: 'DMSans-Bold', fontSize: 10, color: '#ffffff' },
  tierDivider: { height: 1, marginBottom: 10 },
  tierFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  tierCheck: { fontFamily: 'DMSans-Bold', fontSize: 13 },
  tierFeature: { fontFamily: 'DMSans-Regular', fontSize: 13 },
  editAvatarWrap: { alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1 },
  editAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  editAvatarText: { fontFamily: 'DMSans-Bold', fontSize: 28 },
  editDeleteBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 12, borderWidth: 1, borderRadius: 12 },
  editDeleteText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  // Driversnote-style sidebar
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  sidebarBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { position: 'absolute', top: 60, right: 12, width: '80%', maxWidth: 340, borderWidth: 1, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  sidebarBackBtn: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  sidebarTitle: { fontFamily: 'DMSans-Bold', fontSize: 16 },
  sidebarClose: { fontSize: 18 },
  sidebarNav: { flexDirection: 'row', borderBottomWidth: 1 },
  sidebarNavItem: { flex: 1, paddingVertical: 11, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  sidebarNavItemActive: {},
  sidebarNavText: { fontFamily: 'DMSans-Medium', fontSize: 12 },
  sidebarContent: { padding: 16, paddingBottom: 16 },
  // Settings
  settingsOverlay: { flex: 1 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  settingsBack: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  settingsTitle: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  settingsClose: { fontSize: 20 },
  settingsContent: { padding: 20, paddingBottom: 40 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1 },
  settingsRowIcon: { width: 36, alignItems: 'center', justifyContent: 'center' },
  settingsRowLabel: { fontFamily: 'DMSans-Bold', fontSize: 15 },
  settingsRowDesc: { fontFamily: 'DMSans-Regular', fontSize: 12, marginTop: 2 },
  settingsRowArrow: { fontSize: 18 },
  settingsCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  settingsCardTitle: { fontFamily: 'DMSans-Bold', fontSize: 15, marginBottom: 2 },
  settingsCardSub: { fontFamily: 'DMSans-Regular', fontSize: 12, marginTop: 2 },
  settingsInfo: { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  settingsRatePresets: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  settingsRateChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50, borderWidth: 1 },
  settingsRateChipText: { fontFamily: 'DMSans-Medium', fontSize: 13 },
  settingsReportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5 },
  settingsReportLabel: { fontFamily: 'DMSans-Regular', fontSize: 13 },
  settingsReportValue: { fontFamily: 'DMSans-Bold', fontSize: 14 },
  // PayFast checkout
  payfastHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  payfastClose: { fontFamily: 'DMSans-Medium', fontSize: 14 },
  payfastTitle: { fontFamily: 'DMSans-Bold', fontSize: 15 },
  payfastIntro: { paddingTop: 24 },
  payfastInfo: { fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 22 },
  payfastMethodList: { marginTop: 14, gap: 6 },
  payfastMethod: { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 20 },
  payfastSandboxNote: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 18 },
  payfastSandboxText: { fontFamily: 'DMSans-Medium', fontSize: 12, lineHeight: 18 },
  payfastSecureText: { fontFamily: 'DMSans-Regular', fontSize: 11, textAlign: 'center', marginTop: 14 },
  // Payment modal
  paymentModal: { width: '100%', maxWidth: 420, borderRadius: 20, borderWidth: 1, padding: 28 },
  paymentTitle: { fontFamily: 'InstrumentSerif-Regular', fontSize: 26, textAlign: 'center', marginBottom: 16 },
  paymentPlanCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  paymentPlanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentPlanName: { fontFamily: 'DMSans-Bold', fontSize: 16 },
  paymentPlanPrice: { fontFamily: 'DMSans-Bold', fontSize: 18 },
  paymentPlanBilled: { fontFamily: 'DMSans-Regular', fontSize: 11, marginTop: 4 },
  paymentSectionLabel: { fontFamily: 'DMSans-Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  paymentCardRow: { flexDirection: 'row', gap: 12 },
  paymentSecure: { alignItems: 'center', marginTop: 10 },
  paymentSecureText: { fontFamily: 'DMSans-Regular', fontSize: 10, fontStyle: 'italic' },
  centreOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  centreModal: { width: '100%', maxWidth: 400, borderRadius: 20, borderWidth: 1, padding: 28 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  cancelText: { fontFamily: 'DMSans-Medium', fontSize: 14 },
});
