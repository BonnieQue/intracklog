import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useTheme } from '../../lib/useTheme';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { supabase } from '../../lib/supabase';
import { apiListTeams, apiListMyReimbursements, apiSubmitReimbursement, TeamResponse, ReimbursementResponse } from '../../lib/api';

interface ReportEntry {
  id: string; amount: number; expenseType: string; vehicleId: string;
  tripKm: number | null; notes: string | null; entryDate: string;
  tripType: 'business' | 'personal' | null;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MILEAGE_RATE = 4.64;

export default function ExpenseReportScreen() {
  const router = useRouter();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { user } = useAuthStore();
  const toast = useToastStore();
  const { colors: t } = useTheme();

  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<'overview' | 'reconcile'>('overview');

  useEffect(() => { fetchReport(); }, [selectedMonth, selectedYear]);
  useEffect(() => { if (vehicles.length === 0) fetchVehicles().catch(() => {}); }, []);

  const fetchReport = async () => {
    setLoading(true);
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from('entries')
      .select('id, amount, expense_type, vehicle_id, trip_km, notes, entry_date, trip_type')
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false });
    if (data) {
      setEntries(data.map((d: any) => ({
        id: d.id,
        amount: d.amount ? parseFloat(d.amount) : 0,
        expenseType: d.expense_type || 'other',
        vehicleId: d.vehicle_id,
        tripKm: d.trip_km != null ? Number(d.trip_km) : null,
        notes: d.notes,
        entryDate: d.entry_date,
        tripType: d.trip_type ?? null,
      })));
    }
    setLoading(false);
  };

  const classifyTrip = async (id: string, type: 'business' | 'personal') => {
    // optimistic update so the row reacts immediately
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, tripType: type } : e)));
    const { error } = await supabase.from('entries').update({ trip_type: type }).eq('id', id);
    if (error) { toast.show('Could not save classification.'); fetchReport(); }
  };

  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [myReports, setMyReports] = useState<ReimbursementResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadReimbursementData = async () => {
    try {
      const [ts, rs] = await Promise.all([apiListTeams(), apiListMyReimbursements()]);
      setTeams(ts);
      setMyReports(rs);
    } catch { /* non-fatal */ }
  };
  useEffect(() => { loadReimbursementData(); }, []);

  const periodLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;
  const rateForTeam = (team: TeamResponse) =>
    team.rate_type === 'custom' && team.custom_rate ? team.custom_rate : MILEAGE_RATE;

  const submitReimbursement = async (team: TeamResponse) => {
    if (submitting) return;
    setSubmitting(true);
    const rate = rateForTeam(team);
    try {
      await apiSubmitReimbursement({
        team_id: team.id,
        period_label: periodLabel,
        period_start: new Date(selectedYear, selectedMonth, 1).toISOString().slice(0, 10),
        period_end: new Date(selectedYear, selectedMonth + 1, 0).toISOString().slice(0, 10),
        business_km: recon.businessKm,
        rate,
        amount: recon.businessKm * rate,
      });
      toast.show(`Submitted to ${team.name}`);
      await loadReimbursementData();
    } catch (e: any) {
      toast.show(e.message || 'Could not submit reimbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = { submitted: '#85B7EB', approved: '#52AD3B', rejected: '#E05A5A', paid: '#5DCAA5' };

  const navMonth = (dir: number) => {
    let m = selectedMonth + dir, y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m); setSelectedYear(y);
  };

  const totalAmount = useMemo(() => entries.reduce((sum, e) => sum + e.amount, 0), [entries]);
  const totalKm = useMemo(() => entries.reduce((sum, e) => sum + (e.tripKm || 0), 0), [entries]);
  const reimbursement = totalKm * MILEAGE_RATE;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => { map[e.expenseType] = (map[e.expenseType] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const byVehicle = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => { map[e.vehicleId] = (map[e.vehicleId] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const getVehicleName = (id: string) => vehicles.find((v) => v.id === id)?.name || 'Unknown';

  // Reconciliation: cross-check fuel/expenses against logged trips for the month.
  const recon = useMemo(() => {
    const DAY = 86400000;
    const isFuel = (e: ReportEntry) => e.expenseType.toLowerCase() === 'fuel';
    const trips = entries.filter((e) => (e.tripKm || 0) > 0);
    const businessTrips = trips.filter((e) => e.tripType === 'business');
    const unclassifiedTrips = trips.filter((e) => e.tripType == null);
    const businessKm = businessTrips.reduce((s, e) => s + (e.tripKm || 0), 0);
    const reimbursable = businessKm * MILEAGE_RATE;
    const fuelEntries = entries.filter((e) => e.amount > 0 && isFuel(e));
    const km = trips.reduce((s, e) => s + (e.tripKm || 0), 0);
    const fuelTotal = fuelEntries.reduce((s, e) => s + e.amount, 0);
    const otherTotal = entries.filter((e) => e.amount > 0 && !isFuel(e)).reduce((s, e) => s + e.amount, 0);

    // A fuel purchase is "unmatched" if the same vehicle has no trip within 3 days.
    const unmatchedFuel = fuelEntries.filter((f) => {
      const ft = new Date(f.entryDate).getTime();
      return !trips.some((tr) => tr.vehicleId === f.vehicleId && Math.abs(new Date(tr.entryDate).getTime() - ft) <= 3 * DAY);
    });

    const perVehicle: Record<string, { km: number; fuel: number; other: number }> = {};
    entries.forEach((e) => {
      const v = perVehicle[e.vehicleId] || (perVehicle[e.vehicleId] = { km: 0, fuel: 0, other: 0 });
      if ((e.tripKm || 0) > 0) v.km += e.tripKm || 0;
      if (e.amount > 0) { if (isFuel(e)) v.fuel += e.amount; else v.other += e.amount; }
    });

    return {
      km, fuelTotal, otherTotal, businessKm, reimbursable,
      fuelPerKm: km > 0 ? fuelTotal / km : 0,
      allInPerKm: km > 0 ? (fuelTotal + otherTotal) / km : 0,
      hasTrips: km > 0,
      hasFuel: fuelTotal > 0,
      unmatchedFuel,
      unclassifiedTrips,
      perVehicle: Object.entries(perVehicle).filter(([, v]) => v.km > 0 || v.fuel > 0 || v.other > 0),
    };
  }, [entries]);

  const handleShare = async () => {
    const monthYear = `${MONTHS[selectedMonth]} ${selectedYear}`;
    let text = `INTRACKLOG — EXPENSE REPORT\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Period: ${monthYear}\nPrepared for: ${user?.full_name || 'User'}\nGenerated: ${new Date().toLocaleDateString('en-ZA')}\n\n`;
    text += `SUMMARY\n───────────────────────\n`;
    text += `Total Expenses:  R ${totalAmount.toFixed(2)}\nTotal Entries:   ${entries.length}\nTotal Distance:  ${totalKm} km\nMileage Claim:   R ${reimbursement.toFixed(2)} (@ R${MILEAGE_RATE}/km)\n\n`;
    if (byCategory.length > 0) {
      text += `BY CATEGORY\n───────────────────────\n`;
      byCategory.forEach(([cat, amount]) => { text += `${cat.charAt(0).toUpperCase() + cat.slice(1).padEnd(12)} R ${amount.toFixed(2)}\n`; });
      text += `\n`;
    }
    if (entries.length > 0) {
      text += `ENTRIES\n───────────────────────\n`;
      entries.forEach((e) => {
        const date = new Date(e.entryDate);
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        text += `${dateStr}  ${e.expenseType.padEnd(8)} R ${e.amount.toFixed(2).padStart(8)}  ${getVehicleName(e.vehicleId)}\n`;
      });
    }
    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━\nGenerated by InTrackLog`;
    try { await Share.share({ message: text, title: `InTrackLog Report — ${monthYear}` }); }
    catch { toast.show('Failed to share report'); }
  };

  // Embed the logo as a data URI — inline SVG isn't reliable in the PDF engine.
  const getLogoDataUri = async (): Promise<string> => {
    try {
      const asset = Asset.fromModule(require('../../assets/logo-mark.png'));
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      if (Platform.OS === 'web') {
        const blob = await (await fetch(uri)).blob();
        return await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onloadend = () => resolve(fr.result as string);
          fr.readAsDataURL(blob);
        });
      }
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      return `data:image/png;base64,${b64}`;
    } catch {
      return '';
    }
  };

  const buildReportHTML = (logoSrc: string) => {
    const monthYear = `${MONTHS[selectedMonth]} ${selectedYear}`;
    const esc = (s: string) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
    const fmtDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const periodStart = `1 ${MONTHS[selectedMonth].slice(0, 3)} ${selectedYear}`;
    const periodEnd = `${lastDay} ${MONTHS[selectedMonth].slice(0, 3)} ${selectedYear}`;

    const trips = entries.filter((e) => (e.tripKm || 0) > 0).sort((a, b) => a.entryDate.localeCompare(b.entryDate));
    const tripTotalKm = trips.reduce((s, e) => s + (e.tripKm || 0), 0);
    const bizKm = trips.filter((e) => e.tripType === 'business').reduce((s, e) => s + (e.tripKm || 0), 0);
    const bizPct = tripTotalKm > 0 ? (bizKm / tripTotalKm) * 100 : 0;
    const reimb = bizKm * MILEAGE_RATE;
    const vehIds = Array.from(new Set(trips.map((e) => e.vehicleId)));
    const vehicleLabel = vehIds.length === 0 ? '—' : vehIds.length === 1 ? getVehicleName(vehIds[0]) : `Multiple (${vehIds.length})`;

    const destOf = (e: ReportEntry) => {
      if (e.notes && e.notes.startsWith('FROM:')) { const m = e.notes.match(/^FROM:\s*(.+?)\s*→\s*TO:\s*(.+)$/); if (m) return m[2]; }
      return e.notes || '—';
    };
    const typeOf = (e: ReportEntry) => (e.tripType ? e.tripType.charAt(0).toUpperCase() + e.tripType.slice(1) : 'Unclassified');

    const journeyRows = trips.map((e) => {
      const km = e.tripKm || 0;
      const bkm = e.tripType === 'business' ? km : 0;
      return `<tr><td>${fmtDate(e.entryDate)}</td><td>${esc(getVehicleName(e.vehicleId))}</td><td>${esc(destOf(e))}</td><td>${typeOf(e)}</td><td class="r">${km.toFixed(1)}</td><td class="r">${bkm > 0 ? bkm.toFixed(1) : '—'}</td><td class="r">R ${(bkm * MILEAGE_RATE).toFixed(2)}</td></tr>`;
    }).join('');

    // Per-vehicle totals (shown when more than one vehicle was driven this month)
    const perVehRows = vehIds.map((id) => {
      const vt = trips.filter((e) => e.vehicleId === id);
      const vkm = vt.reduce((s, e) => s + (e.tripKm || 0), 0);
      const vbiz = vt.filter((e) => e.tripType === 'business').reduce((s, e) => s + (e.tripKm || 0), 0);
      return `<tr><td>${esc(getVehicleName(id))}</td><td class="r">${vkm.toFixed(1)}</td><td class="r">${vbiz.toFixed(1)}</td><td class="r">R ${(vbiz * MILEAGE_RATE).toFixed(2)}</td></tr>`;
    }).join('');

    const expenseEntries = entries.filter((e) => e.amount > 0).sort((a, b) => a.entryDate.localeCompare(b.entryDate));
    const expenseRows = expenseEntries.map((e) =>
      `<tr><td>${fmtDate(e.entryDate)}</td><td>${esc(e.expenseType.charAt(0).toUpperCase() + e.expenseType.slice(1))}</td><td>${esc(getVehicleName(e.vehicleId))}</td><td class="r">R ${e.amount.toFixed(2)}</td></tr>`).join('');
    const expenseTotal = expenseEntries.reduce((s, e) => s + e.amount, 0);

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box;} body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1a1a1f;padding:28px;font-size:12px;}
      table.box{border-collapse:collapse;font-size:12px;}
      table.box td{border:1px solid #d8d8d8;padding:6px 11px;}
      table.box td.k{background:#f5f5f7;font-weight:bold;color:#444;}
      .name{font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1;}
      .name .in{color:#6a6a76;} .name .tr{color:#52AD3B;} .name .lg{color:#E07A3A;font-style:italic;}
      .tag{font-size:9px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-top:3px;}
      .rate{margin:8px 0 18px;font-size:12px;color:#444;} .rate b{color:#1a1a1f;}
      h2{text-align:center;font-size:18px;margin:14px 0 10px;}
      h3{font-size:13px;color:#52AD3B;margin:24px 0 6px;}
      table.list{width:100%;border-collapse:collapse;font-size:11px;}
      table.list th{background:#52AD3B;color:#fff;text-align:left;padding:8px 9px;font-size:10px;text-transform:uppercase;letter-spacing:.3px;}
      table.list td{padding:7px 9px;border-bottom:1px solid #e6e6e6;}
      table.list td.r,table.list th.r{text-align:right;}
      table.list tr:nth-child(even) td{background:#f4f8f3;}
      table.list tr.tot td{font-weight:bold;background:#eef5ec;border-top:2px solid #52AD3B;}
      .empty{padding:16px;color:#999;text-align:center;border:1px solid #eee;}
      .foot{margin-top:26px;border-top:1px solid #ddd;padding-top:10px;color:#999;font-size:10px;text-align:center;}
    </style></head><body>
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;"><tr>
        <td style="vertical-align:top;">
          <table class="box">
            <tr><td class="k">Vehicle</td><td>${esc(vehicleLabel)}</td></tr>
            <tr><td class="k">Driver</td><td>${esc(user?.full_name || 'User')}</td></tr>
            <tr><td class="k">Period start</td><td>${periodStart}</td></tr>
            <tr><td class="k">Period end</td><td>${periodEnd}</td></tr>
            <tr><td class="k">Total kilometres</td><td>${tripTotalKm.toFixed(1)} km</td></tr>
            <tr><td class="k">Percentage business km</td><td>${bizPct.toFixed(0)}%</td></tr>
          </table>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <table style="margin-left:auto;border-collapse:collapse;"><tr>
            <td style="vertical-align:middle;padding-right:9px;">
              ${logoSrc ? `<img src="${logoSrc}" height="46" style="display:block;" />` : ''}
            </td>
            <td style="vertical-align:middle;text-align:left;">
              <div class="name"><span class="in">In</span><span class="tr">Track</span><span class="lg">Log</span></div>
              <div class="tag">Drive forward. Track smart.</div>
            </td>
          </tr></table>
        </td>
      </tr></table>
      <div class="rate">Mileage rate (${monthYear}): <b>R ${MILEAGE_RATE.toFixed(2)} / km</b> &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-ZA')}</div>

      <h2>Journey list</h2>
      ${journeyRows ? `<table class="list">
        <tr><th>Date</th><th>Vehicle</th><th>Destination</th><th>Business/Personal</th><th class="r">Total distance (km)</th><th class="r">Business km</th><th class="r">Reimbursement</th></tr>
        ${journeyRows}
        <tr class="tot"><td colspan="4">Total</td><td class="r">${tripTotalKm.toFixed(1)}</td><td class="r">${bizKm.toFixed(1)}</td><td class="r">R ${reimb.toFixed(2)}</td></tr>
      </table>` : `<div class="empty">No journeys logged for ${monthYear}.</div>`}

      ${vehIds.length > 1 ? `<h3>Totals by vehicle</h3><table class="list">
        <tr><th>Vehicle</th><th class="r">Total km</th><th class="r">Business km</th><th class="r">Reimbursement</th></tr>
        ${perVehRows}
      </table>` : ''}

      ${expenseRows ? `<h3>Other expenses</h3><table class="list">
        <tr><th>Date</th><th>Type</th><th>Vehicle</th><th class="r">Amount</th></tr>
        ${expenseRows}
        <tr class="tot"><td colspan="3">Total</td><td class="r">R ${expenseTotal.toFixed(2)}</td></tr>
      </table>` : ''}

      <div class="foot">Generated by InTrackLog · ${monthYear}</div>
    </body></html>`;
  };

  const handleSharePDF = async () => {
    try {
      const logoSrc = await getLogoDataUri();
      const html = buildReportHTML(logoSrc);
      if (Platform.OS === 'web') {
        // Print our exact HTML via a hidden iframe — expo-print's web path
        // doesn't reliably render the passed html. This guarantees the report.
        const iframe = document.createElement('iframe');
        Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open(); doc.write(html); doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => iframe.remove(), 1500);
          }, 400);
        }
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `InTrackLog Report — ${MONTHS[selectedMonth]} ${selectedYear}` });
      } else {
        toast.show('Sharing is not available on this device.');
      }
    } catch {
      toast.show('Could not create the PDF.');
    }
  };

  const CAT_COLORS: Record<string, string> = { fuel: '#F0997B', service: '#85B7EB', tyres: '#AFA9EC', toll: '#5DCAA5', other: '#8a8a96' };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: t.textMuted }]}>← Back to dashboard</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.text }]}>Expense <Text style={[styles.titleAccent, { color: t.accent }]}>report</Text></Text>

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => navMonth(-1)} style={[styles.monthBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.monthArrow, { color: t.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: t.text }]}>{MONTHS[selectedMonth]} {selectedYear}</Text>
          <TouchableOpacity onPress={() => navMonth(1)} style={[styles.monthBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.monthArrow, { color: t.text }]}>›</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color={t.accent} size="large" style={{ marginTop: 40 }} /> : (
          <>
            <View style={styles.tabRow}>
              {(['overview', 'reconcile'] as const).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTab(key)}
                  style={[styles.tabBtn, { backgroundColor: tab === key ? t.accent : t.surface, borderColor: tab === key ? t.accent : t.border }]}
                >
                  <Text style={[styles.tabBtnText, { color: tab === key ? '#ffffff' : t.textMuted }]}>{key === 'overview' ? 'Overview' : 'Reconcile'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'overview' && (
            <>
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>TOTAL SPENT</Text><Text style={[styles.summaryValue, { color: t.accent }]}>R {totalAmount.toFixed(2)}</Text></Card>
              <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>ENTRIES</Text><Text style={[styles.summaryValue, { color: t.accent }]}>{entries.length}</Text></Card>
            </View>
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>DISTANCE</Text><Text style={[styles.summaryValue, { color: t.accent }]}>{totalKm} km</Text></Card>
              <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>MILEAGE CLAIM</Text><Text style={[styles.summaryValue, { color: '#5DCAA5', fontSize: 16 }]}>R {reimbursement.toFixed(2)}</Text></Card>
            </View>

            <Text style={[styles.sectionLabel, { color: t.accent }]}>BY CATEGORY</Text>
            <Card style={styles.breakdownCard}>
              {byCategory.length > 0 ? byCategory.map(([cat, amount]) => (
                <View key={cat} style={[styles.breakdownRow, { borderBottomColor: t.border }]}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.catDot, { backgroundColor: CAT_COLORS[cat] || '#8a8a96' }]} />
                    <Text style={[styles.breakdownName, { color: t.text }]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                  </View>
                  <Text style={[styles.breakdownAmount, { color: t.text }]}>R {amount.toFixed(2)}</Text>
                  <Text style={[styles.breakdownPct, { color: t.textMuted }]}>{totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(0) : 0}%</Text>
                </View>
              )) : <Text style={[styles.noData, { color: t.textMuted }]}>No expenses this month</Text>}
            </Card>

            <Text style={[styles.sectionLabel, { color: t.accent }]}>BY VEHICLE</Text>
            <Card style={styles.breakdownCard}>
              {byVehicle.length > 0 ? byVehicle.map(([vid, amount]) => (
                <View key={vid} style={[styles.breakdownRow, { borderBottomColor: t.border }]}>
                  <Text style={[styles.breakdownName, { color: t.text }]}>{getVehicleName(vid)}</Text>
                  <Text style={[styles.breakdownAmount, { color: t.text }]}>R {amount.toFixed(2)}</Text>
                </View>
              )) : <Text style={[styles.noData, { color: t.textMuted }]}>No expenses this month</Text>}
            </Card>

            <View style={styles.shareSection}>
              <Button title="Share as PDF" onPress={handleSharePDF} fullWidth />
              <View style={{ height: 10 }} />
              <Button title="Share as text" variant="secondary" onPress={handleShare} fullWidth />
              <Text style={[styles.shareHint, { color: t.textMuted }]}>Share via WhatsApp or email — as a PDF or plain text</Text>
            </View>
            </>
            )}

            {tab === 'reconcile' && (
            <>
              <View style={styles.summaryRow}>
                <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>BUSINESS KM</Text><Text style={[styles.summaryValue, { color: t.accent }]}>{recon.businessKm.toFixed(1)} km</Text></Card>
                <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>REIMBURSABLE</Text><Text style={[styles.summaryValue, { color: '#5DCAA5', fontSize: 16 }]}>R {recon.reimbursable.toFixed(2)}</Text></Card>
              </View>
              <Text style={[styles.reconNote, { color: t.textMuted, marginTop: 0, marginBottom: 6 }]}>Reimbursable = business-classified km × R{MILEAGE_RATE.toFixed(2)}/km.</Text>

              <Text style={[styles.sectionLabel, { color: t.accent, marginTop: 8 }]}>SUBMIT FOR REIMBURSEMENT · {periodLabel}</Text>
              <Card style={styles.breakdownCard}>
                {(() => {
                  const periodReports = myReports.filter((r) => r.period_label === periodLabel);
                  if (recon.businessKm <= 0) return <Text style={[styles.noData, { color: t.textMuted }]}>Classify business trips above to submit a claim.</Text>;
                  if (teams.length === 0) return <Text style={[styles.noData, { color: t.textMuted }]}>Join or create a team (your employer) to submit a reimbursement.</Text>;
                  return teams.map((team) => {
                    const existing = periodReports.find((r) => r.team_id === team.id);
                    const rate = rateForTeam(team);
                    return (
                      <View key={team.id} style={[styles.classifyRow, { borderBottomColor: t.border }]}>
                        <View style={styles.classifyInfo}>
                          <Text style={[styles.classifyRoute, { color: t.text }]} numberOfLines={1}>{team.name}</Text>
                          <Text style={[styles.classifyMeta, { color: t.textMuted }]}>{recon.businessKm.toFixed(1)} km × R{rate.toFixed(2)} = R{(recon.businessKm * rate).toFixed(2)}</Text>
                        </View>
                        {existing ? (
                          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[existing.status] || t.textMuted) + '22' }]}>
                            <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[existing.status] || t.textMuted }]}>{existing.status}</Text>
                          </View>
                        ) : (
                          <TouchableOpacity disabled={submitting} onPress={() => submitReimbursement(team)} style={[styles.classBtn, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
                            <Text style={[styles.classBtnText, { color: t.accent }]}>Submit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  });
                })()}
              </Card>

              <View style={styles.summaryRow}>
                <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>DISTANCE</Text><Text style={[styles.summaryValue, { color: t.accent }]}>{recon.km.toFixed(1)} km</Text></Card>
                <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>FUEL SPEND</Text><Text style={[styles.summaryValue, { color: t.accent }]}>R {recon.fuelTotal.toFixed(2)}</Text></Card>
              </View>
              <View style={styles.summaryRow}>
                <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>FUEL / KM</Text><Text style={[styles.summaryValue, { color: t.accent }]}>{recon.km > 0 ? `R ${recon.fuelPerKm.toFixed(2)}` : '—'}</Text></Card>
                <Card style={styles.summaryCard}><Text style={[styles.summaryLabel, { color: t.textMuted }]}>ALL-IN / KM</Text><Text style={[styles.summaryValue, { color: t.accent }]}>{recon.km > 0 ? `R ${recon.allInPerKm.toFixed(2)}` : '—'}</Text></Card>
              </View>

              {recon.unclassifiedTrips.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: t.accent }]}>CLASSIFY TRIPS · {recon.unclassifiedTrips.length}</Text>
                  <Card style={styles.breakdownCard}>
                    {recon.unclassifiedTrips.map((tr) => {
                      const d = new Date(tr.entryDate);
                      let route = '';
                      if (tr.notes?.startsWith('FROM:')) {
                        const m = tr.notes.match(/^FROM:\s*(.+?)\s*→\s*TO:\s*(.+)$/);
                        if (m) route = `${m[1]} → ${m[2]}`;
                      }
                      return (
                        <View key={tr.id} style={[styles.classifyRow, { borderBottomColor: t.border }]}>
                          <View style={styles.classifyInfo}>
                            <Text style={[styles.classifyMeta, { color: t.textMuted }]}>{d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)} · {(tr.tripKm || 0).toFixed(1)} km</Text>
                            <Text numberOfLines={1} style={[styles.classifyRoute, { color: t.text }]}>{route || getVehicleName(tr.vehicleId)}</Text>
                          </View>
                          <TouchableOpacity onPress={() => classifyTrip(tr.id, 'business')} style={[styles.classBtn, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
                            <Text style={[styles.classBtnText, { color: t.accent }]}>Business</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => classifyTrip(tr.id, 'personal')} style={[styles.classBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
                            <Text style={[styles.classBtnText, { color: t.textMuted }]}>Personal</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </Card>
                </>
              )}

              <Text style={[styles.sectionLabel, { color: t.accent }]}>THINGS TO CHECK</Text>
              <Card style={styles.breakdownCard}>
                {(() => {
                  const flags: { ok?: boolean; text: string }[] = [];
                  if (recon.hasFuel && !recon.hasTrips) flags.push({ text: 'Fuel logged but no trips recorded this month.' });
                  if (recon.hasTrips && !recon.hasFuel) flags.push({ text: 'Trips logged but no fuel expense this month.' });
                  recon.unmatchedFuel.forEach((f) => {
                    const d = new Date(f.entryDate);
                    flags.push({ text: `R ${f.amount.toFixed(2)} fuel on ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} (${getVehicleName(f.vehicleId)}) — no trip within 3 days.` });
                  });
                  if (entries.length === 0) return <Text style={[styles.noData, { color: t.textMuted }]}>No entries this month.</Text>;
                  if (flags.length === 0) flags.push({ ok: true, text: 'Everything reconciles for this month.' });
                  return flags.map((f, i) => (
                    <View key={i} style={[styles.flagRow, { borderBottomColor: t.border }]}>
                      <View style={[styles.flagDot, { backgroundColor: f.ok ? t.accent : t.warning }]} />
                      <Text style={[styles.flagText, { color: t.text }]}>{f.text}</Text>
                    </View>
                  ));
                })()}
              </Card>

              <Text style={[styles.sectionLabel, { color: t.accent }]}>PER VEHICLE</Text>
              <Card style={styles.breakdownCard}>
                {recon.perVehicle.length > 0 ? recon.perVehicle.map(([vid, v]) => (
                  <View key={vid} style={[styles.breakdownRow, { borderBottomColor: t.border }]}>
                    <Text style={[styles.breakdownName, { color: t.text }]}>{getVehicleName(vid)}</Text>
                    <Text style={[styles.breakdownPct, { color: t.textMuted, width: 'auto', marginRight: 12 }]}>{v.km.toFixed(0)} km</Text>
                    <Text style={[styles.breakdownAmount, { color: t.text }]}>R {(v.fuel + v.other).toFixed(2)}</Text>
                    <Text style={[styles.breakdownPct, { color: t.textMuted }]}>{v.km > 0 ? `R${((v.fuel + v.other) / v.km).toFixed(2)}/km` : '—'}</Text>
                  </View>
                )) : <Text style={[styles.noData, { color: t.textMuted }]}>No vehicle activity this month.</Text>}
              </Card>

              <Text style={[styles.reconNote, { color: t.textMuted }]}>Checks compare logged trips against fuel/expenses within this month. A fuel purchase is flagged if its vehicle has no trip within 3 days.</Text>
            </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingVertical: 24, paddingBottom: 40, paddingHorizontal: '15%' },
  backBtn: { paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 16 },
  backText: { fontSize: 14, fontFamily: 'DMSans-Medium' },
  title: { fontFamily: 'InstrumentSerif-Regular', fontSize: 28, letterSpacing: -0.5, marginBottom: 20 },
  titleAccent: { fontFamily: 'InstrumentSerif-Italic' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 20 },
  monthBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthArrow: { fontSize: 20 },
  monthLabel: { fontSize: 16, fontFamily: 'DMSans-Bold' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, padding: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 9, letterSpacing: 1.5, fontFamily: 'DMSans-Bold', marginBottom: 6 },
  summaryValue: { fontSize: 20, fontFamily: 'DMSans-Bold', letterSpacing: -0.5 },
  sectionLabel: { fontSize: 11, letterSpacing: 2, fontFamily: 'DMSans-Bold', marginTop: 20, marginBottom: 10 },
  breakdownCard: { padding: 0 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownName: { flex: 1, fontSize: 14, fontFamily: 'DMSans-Medium' },
  breakdownAmount: { fontSize: 14, fontFamily: 'DMSans-Bold', marginRight: 12 },
  breakdownPct: { fontSize: 12, fontFamily: 'DMSans-Medium', width: 36, textAlign: 'right' },
  noData: { padding: 20, fontSize: 13, fontFamily: 'DMSans-Regular', textAlign: 'center' },
  shareSection: { marginTop: 28, alignItems: 'center' },
  shareHint: { fontSize: 12, fontFamily: 'DMSans-Regular', marginTop: 10 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  tabBtnText: { fontSize: 12, fontFamily: 'DMSans-Bold', letterSpacing: 0.3 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  flagDot: { width: 8, height: 8, borderRadius: 4 },
  flagText: { flex: 1, fontSize: 13, fontFamily: 'DMSans-Medium', lineHeight: 18 },
  reconNote: { fontSize: 11, fontFamily: 'DMSans-Regular', lineHeight: 16, marginTop: 16 },
  classifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  classifyInfo: { flex: 1 },
  classifyMeta: { fontSize: 10, fontFamily: 'DMSans-Bold', letterSpacing: 0.3, marginBottom: 2 },
  classifyRoute: { fontSize: 13, fontFamily: 'DMSans-Medium' },
  classBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 7, borderWidth: 1 },
  classBtnText: { fontSize: 11, fontFamily: 'DMSans-Bold' },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20 },
  statusBadgeText: { fontSize: 10, fontFamily: 'DMSans-Bold', textTransform: 'capitalize', letterSpacing: 0.3 },
});
