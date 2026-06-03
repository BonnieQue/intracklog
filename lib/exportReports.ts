import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { EntryResponse, VehicleResponse } from './api';

interface ReportData {
  user: { name: string; email: string; employeeNumber?: string };
  entries: EntryResponse[];
  vehicles: VehicleResponse[];
  dateFrom?: string;
  dateTo?: string;
  mileageRate: number;
}

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getDate()} ${date.toLocaleString('en-ZA', { month: 'short' })} ${date.getFullYear()}`;
}

/**
 * Build HTML for the PDF report.
 */
function buildReportHTML(data: ReportData): string {
  const { user, entries, vehicles, mileageRate, dateFrom, dateTo } = data;
  const tripEntries = entries.filter((e) => e.trip_km && e.trip_km > 0).sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const totalKm = tripEntries.reduce((s, e) => s + (e.trip_km || 0), 0);
  const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);
  const totalReimbursement = totalKm * mileageRate;

  const oldest = tripEntries[0]?.entry_date || '';
  const newest = tripEntries[tripEntries.length - 1]?.entry_date || '';
  const periodLabel = dateFrom && dateTo
    ? `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
    : oldest && newest
      ? `${formatDate(oldest)} – ${formatDate(newest)}`
      : 'All time';

  const rows = tripEntries.map((e) => {
    const v = vehicles.find((veh) => veh.id === e.vehicle_id);
    let from = '', to = '';
    if (e.notes?.startsWith('FROM:')) {
      const m = e.notes.match(/^FROM:\s*(.+?)\s*→\s*TO:\s*(.+)$/);
      if (m) { from = m[1]; to = m[2]; }
    }
    return `<tr>
      <td>${formatDate(e.entry_date)}</td>
      <td>${v?.description || v?.name || '—'}</td>
      <td>${v?.reg_number || '—'}</td>
      <td>${from || '—'}</td>
      <td>${to || '—'}</td>
      <td style="text-align:right">${e.trip_km} km</td>
      <td style="text-align:right">${formatCurrency((e.trip_km || 0) * mileageRate)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, sans-serif; padding: 30px; color: #1a1a1f; }
  h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: -0.5px; }
  .period { color: #666; font-size: 13px; margin-bottom: 24px; }
  .driver-block { background: #f5f5f7; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
  .driver-block strong { display: inline-block; width: 120px; color: #555; }
  h2 { font-size: 16px; margin: 28px 0 12px; color: #52AD3B; }
  .summary { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .summary td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
  .summary tr:last-child td { border-bottom: 2px solid #1a1a1f; font-weight: bold; padding-top: 12px; }
  table.trips { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.trips th { background: #52AD3B; color: white; padding: 8px 6px; text-align: left; font-weight: bold; font-size: 10px; letter-spacing: 0.3px; text-transform: uppercase; }
  table.trips td { padding: 8px 6px; border-bottom: 1px solid #eee; }
  table.trips tr:nth-child(even) { background: #fafafa; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #888; text-align: center; }
</style>
</head>
<body>
  <h1>Mileage & Expense Report</h1>
  <div class="period">${periodLabel}</div>

  <div class="driver-block">
    <div><strong>Driver:</strong> ${user.name}</div>
    <div><strong>Email:</strong> ${user.email}</div>
    ${user.employeeNumber ? `<div><strong>Employee no.:</strong> ${user.employeeNumber}</div>` : ''}
    <div><strong>Generated:</strong> ${formatDate(new Date().toISOString())}</div>
  </div>

  <h2>Summary</h2>
  <table class="summary">
    <tr><td>Total trips logged</td><td style="text-align:right">${tripEntries.length}</td></tr>
    <tr><td>Total distance</td><td style="text-align:right">${totalKm.toLocaleString()} km</td></tr>
    <tr><td>Mileage rate</td><td style="text-align:right">${formatCurrency(mileageRate)}/km</td></tr>
    <tr><td>Reimbursement</td><td style="text-align:right">${formatCurrency(totalReimbursement)}</td></tr>
    <tr><td>Other expenses</td><td style="text-align:right">${formatCurrency(totalAmount)}</td></tr>
    <tr><td>Total</td><td style="text-align:right">${formatCurrency(totalReimbursement + totalAmount)}</td></tr>
  </table>

  <h2>Trip Log</h2>
  <table class="trips">
    <thead>
      <tr>
        <th>Date</th><th>Vehicle</th><th>Plate</th><th>From</th><th>To</th><th style="text-align:right">Distance</th><th style="text-align:right">Reimbursement</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:20px">No trips recorded.</td></tr>'}</tbody>
  </table>

  <div class="footer">Generated by InTrackLog · This report is intended for SARS travel allowance claims and employer reimbursement.</div>
</body>
</html>`;
}

/**
 * Generate and share a PDF report.
 */
export async function exportReportPDF(data: ReportData): Promise<void> {
  const html = buildReportHTML(data);
  const { uri } = await Print.printToFileAsync({ html });
  if (Platform.OS === 'web') {
    // On web, just open it
    window.open(uri, '_blank');
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share trip report' });
  }
}

/**
 * Generate and share a CSV report (Excel-compatible).
 */
export async function exportReportCSV(data: ReportData): Promise<void> {
  const { entries, vehicles, mileageRate } = data;
  const tripEntries = entries.filter((e) => e.trip_km && e.trip_km > 0).sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  const escape = (s: any) => {
    if (s === null || s === undefined) return '';
    const str = String(s);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = ['Date', 'Vehicle', 'Licence Plate', 'From', 'To', 'Distance (km)', 'Type', 'Amount (R)', 'Reimbursement (R)', 'Notes'].join(',');
  const rows = tripEntries.map((e) => {
    const v = vehicles.find((veh) => veh.id === e.vehicle_id);
    let from = '', to = '';
    if (e.notes?.startsWith('FROM:')) {
      const m = e.notes.match(/^FROM:\s*(.+?)\s*→\s*TO:\s*(.+)$/);
      if (m) { from = m[1]; to = m[2]; }
    }
    return [
      e.entry_date,
      v?.description || v?.name || '',
      v?.reg_number || '',
      from, to,
      e.trip_km || 0,
      e.expense_type || 'Trip',
      e.amount || 0,
      ((e.trip_km || 0) * mileageRate).toFixed(2),
      e.notes && !e.notes.startsWith('FROM:') ? e.notes : '',
    ].map(escape).join(',');
  });

  const csv = [header, ...rows].join('\n');
  const filename = `intracklog-report-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Share trip data' });
  }
}

/**
 * Export ALL user data as JSON (POPIA right to portability).
 */
export async function exportAllData(data: ReportData & { locations?: any[]; teams?: any[]; settings?: any }): Promise<void> {
  const json = JSON.stringify({
    exported_at: new Date().toISOString(),
    user: data.user,
    settings: data.settings || {},
    vehicles: data.vehicles,
    entries: data.entries,
    locations: data.locations || [],
    teams: data.teams || [],
  }, null, 2);

  const filename = `intracklog-data-export-${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export your InTrackLog data' });
  }
}
