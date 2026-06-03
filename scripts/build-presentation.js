// Generates an editable PowerPoint deck for InTrackLog
// Run: node scripts/build-presentation.js
const PptxGenJS = require('pptxgenjs');

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches (16:9)
pres.author = 'InTrackLog (Pty) Ltd';
pres.company = 'InTrackLog';
pres.title = 'InTrackLog · Drive forward. Track smart.';

// ─── Brand colours ──────────────────────────────────────────────
const COL = {
  bgDark:    '0A0A0C',
  bgMid:     '131318',
  cream:     'F0EFE8',
  ink:       '1A1A1F',
  inkSoft:   '4A4A55',
  inkMuted:  '8A8A96',
  accent:    '2D9F6F',
  accentDim: '238A5D',
  secondary: 'E07A3A',
  secondaryDim: 'C96A30',
  info:      '85B7EB',
  white:     'FFFFFF',
  light:     'F7F6F1',
  paper:     'FFFFFF',
  line:      'E2E1DA',
};

// ─── Reusable text styles ──────────────────────────────────────
const fontSerif = 'Times New Roman'; // PowerPoint-safe substitute for Instrument Serif
const fontSans  = 'Calibri';         // PowerPoint-safe substitute for DM Sans

// ─── Slide 1: Cover ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  // Glow effect
  s.addShape('ellipse', { x: 9, y: -2, w: 6, h: 6, fill: { color: COL.accent, transparency: 80 }, line: { color: COL.accent, transparency: 100 } });
  s.addShape('ellipse', { x: -2, y: 4, w: 5, h: 5, fill: { color: COL.secondary, transparency: 85 }, line: { color: COL.secondary, transparency: 100 } });
  // InTrackLog brand
  s.addText([
    { text: 'In', options: { color: COL.inkMuted, bold: true } },
    { text: 'Track', options: { color: COL.accent, bold: true } },
    { text: 'Log', options: { color: COL.secondary, italic: true } },
  ], { x: 0.5, y: 0.4, w: 5, h: 0.7, fontFace: fontSerif, fontSize: 32 });
  // Eyebrow
  s.addText('SOUTH AFRICAN MILEAGE TRACKING', {
    x: 1.5, y: 2.6, w: 10.3, h: 0.4,
    fontFace: fontSans, fontSize: 11, color: COL.accent,
    charSpacing: 6, align: 'center', bold: false,
  });
  // Big title
  s.addText([
    { text: 'Drive forward.\n', options: { color: COL.cream } },
    { text: 'Track smart.', options: { color: COL.accent, italic: true } },
  ], {
    x: 1.5, y: 3.1, w: 10.3, h: 2.4,
    fontFace: fontSerif, fontSize: 80, align: 'center', valign: 'middle',
  });
  // Subtitle
  s.addText('A modern, mobile-first vehicle log designed for SARS reporting, employer reimbursement, and team fleet management.', {
    x: 2.5, y: 5.6, w: 8.3, h: 0.9,
    fontFace: fontSans, fontSize: 16, color: COL.cream, align: 'center',
    transparency: 35,
  });
  // Footer
  s.addText('intracklog.com  ·  2026', {
    x: 1.5, y: 6.9, w: 10.3, h: 0.3,
    fontFace: fontSans, fontSize: 11, color: COL.cream,
    transparency: 50, align: 'center', charSpacing: 3,
  });
}

// ─── Slide 2: The Problem ───────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.light };
  s.addText('THE PROBLEM', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, bold: false, charSpacing: 6 });
  s.addText([
    { text: 'Mileage logs are still done\non ', options: { color: COL.ink } },
    { text: 'paper, spreadsheets, or memory', options: { color: COL.secondary, italic: true } },
    { text: '.', options: { color: COL.ink } },
  ], { x: 0.6, y: 1, w: 8, h: 2, fontFace: fontSerif, fontSize: 44 });

  s.addText('Every year, South Africans claim travel allowances and reimbursement that depend on accurate mileage records — but most still rely on:', {
    x: 0.6, y: 3.3, w: 7, h: 0.8, fontFace: fontSans, fontSize: 14, color: COL.inkSoft,
  });
  const issues = [
    '📓  Paper logbooks lost in glove boxes',
    '📊  Spreadsheets filled in months later',
    '🤔  Approximate guesses at year-end',
    '📵  Apps designed for the US, not SA',
    '💸  Lost reimbursements from missed trips',
  ];
  issues.forEach((line, i) => {
    s.addText(line, {
      x: 0.6, y: 4.2 + i * 0.45, w: 7, h: 0.4,
      fontFace: fontSans, fontSize: 14, color: COL.inkSoft,
    });
  });

  // Stat panel on the right
  s.addShape('roundRect', { x: 9, y: 1.2, w: 3.8, h: 5.5, fill: { color: COL.paper }, line: { color: COL.line, width: 1 }, rectRadius: 0.15 });
  s.addText('8 million', { x: 9.2, y: 1.5, w: 3.4, h: 1, fontFace: fontSerif, fontSize: 44, color: COL.secondary, bold: true });
  s.addText('VEHICLES ON SA ROADS', { x: 9.2, y: 2.4, w: 3.4, h: 0.3, fontFace: fontSans, fontSize: 10, color: COL.inkMuted, charSpacing: 2 });
  s.addText('R 4.64', { x: 9.2, y: 3, w: 3.4, h: 1, fontFace: fontSerif, fontSize: 44, color: COL.accent, bold: true });
  s.addText('SARS RATE PER KILOMETRE', { x: 9.2, y: 3.9, w: 3.4, h: 0.3, fontFace: fontSans, fontSize: 10, color: COL.inkMuted, charSpacing: 2 });
  s.addText('5 years', { x: 9.2, y: 4.5, w: 3.4, h: 1, fontFace: fontSerif, fontSize: 44, color: COL.info, bold: true });
  s.addText('SARS RETENTION REQUIRED', { x: 9.2, y: 5.4, w: 3.4, h: 0.3, fontFace: fontSans, fontSize: 10, color: COL.inkMuted, charSpacing: 2 });
}

// ─── Slide 3: The Solution ──────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addText('THE SOLUTION', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'A logbook that\n', options: { color: COL.cream } },
    { text: 'tracks itself.', options: { color: COL.accent, italic: true } },
  ], { x: 0.6, y: 1, w: 12, h: 2.2, fontFace: fontSerif, fontSize: 64 });
  s.addText('InTrackLog is a mobile-first vehicle tracker built for South African drivers. GPS captures the trip, the app calculates the rest, and reports come ready for SARS or your employer.', {
    x: 0.6, y: 3.4, w: 11, h: 1.2, fontFace: fontSans, fontSize: 18, color: COL.cream, transparency: 30,
  });
  // Three stats
  const stats = [
    { num: 'GPS', label: 'AUTO TRIP TRACKING' },
    { num: 'PDF', label: 'SARS-READY REPORTS' },
    { num: 'ZAR', label: 'LOCAL PAYMENTS · PAYFAST' },
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape('roundRect', { x, y: 4.9, w: 3.8, h: 1.9, fill: { color: '1A1A22' }, line: { color: '2A2A30', width: 1 }, rectRadius: 0.15 });
    s.addText(st.num, { x: x + 0.2, y: 5.0, w: 3.4, h: 1.2, fontFace: fontSerif, fontSize: 56, color: COL.accent, bold: true });
    s.addText(st.label, { x: x + 0.2, y: 6.3, w: 3.4, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.cream, transparency: 40, charSpacing: 2, bold: true });
  });
}

// ─── Slide 4: Key Features ──────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.light };
  s.addText('KEY FEATURES', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Everything you need to\nstay ', options: { color: COL.ink } },
    { text: 'on track', options: { color: COL.accent, italic: true } },
    { text: '.', options: { color: COL.ink } },
  ], { x: 0.6, y: 0.95, w: 12, h: 1.5, fontFace: fontSerif, fontSize: 48 });

  const features = [
    { icon: '📍', color: COL.accent, title: 'GPS Trip Tracking', desc: 'One tap to start. Records distance, route, time, and start/end locations automatically.' },
    { icon: '🚗', color: COL.secondary, title: 'Vehicle Management', desc: 'Track multiple vehicles. Each with its own odometer, registration, and trip history.' },
    { icon: '💰', color: COL.info, title: 'Expense Logging', desc: 'Fuel, service, tyres, tolls. Attach receipts. Keep everything in one searchable place.' },
    { icon: '📄', color: COL.accent, title: 'SARS-Ready Reports', desc: 'One-tap export to PDF, CSV, or full data backup. Includes employee number for reimbursement.' },
    { icon: '👥', color: COL.secondary, title: 'Teams & Workplaces', desc: 'Share workplace settings with colleagues. Pro and Business plans include team management.' },
    { icon: '🔒', color: COL.info, title: 'POPIA-Compliant', desc: 'Encrypted storage, row-level security, never sold. Your data stays yours.' },
  ];
  features.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.2, y = 3 + row * 2.2;
    s.addShape('roundRect', { x, y, w: 4, h: 2, fill: { color: COL.paper }, line: { color: COL.line, width: 1 }, rectRadius: 0.12 });
    s.addShape('roundRect', { x: x + 0.25, y: y + 0.2, w: 0.55, h: 0.55, fill: { color: f.color }, line: { color: f.color }, rectRadius: 0.08 });
    s.addText(f.icon, { x: x + 0.25, y: y + 0.2, w: 0.55, h: 0.55, fontFace: fontSans, fontSize: 18, align: 'center', valign: 'middle' });
    s.addText(f.title, { x: x + 0.25, y: y + 0.85, w: 3.5, h: 0.35, fontFace: fontSans, fontSize: 14, color: COL.ink, bold: true });
    s.addText(f.desc, { x: x + 0.25, y: y + 1.2, w: 3.5, h: 0.7, fontFace: fontSans, fontSize: 11, color: COL.inkSoft });
  });
}

// ─── Slide 5: Dashboard ─────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addText('THE DASHBOARD', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Five', options: { color: COL.accent, italic: true } },
    { text: ' buttons to your full fleet.', options: { color: COL.cream } },
  ], { x: 0.6, y: 1, w: 12, h: 1.5, fontFace: fontSerif, fontSize: 56 });
  s.addText('A clean home screen with live stats, your current vehicle, recent trips, and instant access to every key feature.', {
    x: 0.6, y: 2.8, w: 11, h: 0.8, fontFace: fontSans, fontSize: 16, color: COL.cream, transparency: 30,
  });
  // 5 nav tiles
  const navs = ['VEHICLES', 'TRIPS', 'LOCATIONS', 'REPORTS', 'TEAMS'];
  const icons = ['🚗', '📊', '📍', '📋', '👥'];
  navs.forEach((label, i) => {
    const x = 0.6 + i * 2.5, y = 4.2;
    s.addShape('roundRect', { x, y, w: 2.2, h: 2.2, fill: { color: '1A1A22' }, line: { color: COL.accent, width: 1 }, rectRadius: 0.2 });
    s.addText(icons[i], { x, y: y + 0.3, w: 2.2, h: 1, fontFace: fontSans, fontSize: 44, align: 'center' });
    s.addText(label, { x, y: y + 1.5, w: 2.2, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.cream, align: 'center', bold: true, charSpacing: 1 });
  });
}

// ─── Slide 6: GPS Trip Tracking ─────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.accent };
  s.addText('TRIP TRACKING', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.cream, charSpacing: 6 });
  s.addText([
    { text: 'Tap once.\nDrive. ', options: { color: COL.cream } },
    { text: 'Done.', options: { color: COL.cream, italic: true } },
  ], { x: 0.6, y: 1, w: 8, h: 2.5, fontFace: fontSerif, fontSize: 60 });

  s.addText("InTrackLog uses your phone's GPS to record every kilometre — automatically calculating distance, capturing the route, and reverse-geocoding the start and end addresses.", {
    x: 0.6, y: 3.6, w: 7.8, h: 1.5, fontFace: fontSans, fontSize: 16, color: COL.cream, transparency: 15,
  });

  // KV list
  const kvs = [
    { k: 'No fuss', v: 'One-tap to start, one-tap to stop' },
    { k: 'Smart', v: 'Auto-detects start & end addresses' },
    { k: 'Private', v: 'Only tracks when you start a trip' },
  ];
  kvs.forEach((kv, i) => {
    const y = 5.2 + i * 0.6;
    s.addText(kv.k, { x: 0.6, y, w: 1.8, h: 0.5, fontFace: fontSerif, fontSize: 22, italic: true, color: COL.cream });
    s.addText(kv.v, { x: 2.6, y, w: 5.5, h: 0.5, fontFace: fontSans, fontSize: 14, color: COL.cream, transparency: 15 });
  });

  // Right panel: trip card
  s.addShape('roundRect', { x: 9, y: 1.5, w: 4, h: 5.5, fill: { color: COL.bgDark, transparency: 25 }, line: { color: COL.cream, transparency: 70, width: 1 }, rectRadius: 0.2 });
  s.addText('42', { x: 9.2, y: 1.7, w: 3.6, h: 2.2, fontFace: fontSerif, fontSize: 110, color: COL.cream, align: 'center' });
  s.addText('km recorded', { x: 9.2, y: 3.6, w: 3.6, h: 0.4, fontFace: fontSans, fontSize: 14, color: COL.cream, transparency: 25, align: 'center' });
  // Route timeline
  s.addShape('ellipse', { x: 9.5, y: 4.6, w: 0.2, h: 0.2, fill: { color: COL.cream, transparency: 100 }, line: { color: COL.cream, width: 2 } });
  s.addText('Sandton, Johannesburg', { x: 9.85, y: 4.5, w: 3, h: 0.4, fontFace: fontSans, fontSize: 12, color: COL.cream });
  s.addShape('rect', { x: 9.6, y: 4.85, w: 0.03, h: 0.5, fill: { color: COL.cream, transparency: 50 }, line: { color: COL.cream, transparency: 100 } });
  s.addShape('ellipse', { x: 9.5, y: 5.4, w: 0.2, h: 0.2, fill: { color: COL.cream }, line: { color: COL.cream } });
  s.addText('Pretoria CBD', { x: 9.85, y: 5.3, w: 3, h: 0.4, fontFace: fontSans, fontSize: 12, color: COL.cream });
}

// ─── Slide 7: Reports ───────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.light };
  s.addText('SARS-READY REPORTS', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Reports built for\n', options: { color: COL.ink } },
    { text: 'submission', options: { color: COL.accent, italic: true } },
    { text: ', not editing.', options: { color: COL.ink } },
  ], { x: 0.6, y: 1, w: 12, h: 1.8, fontFace: fontSerif, fontSize: 50 });

  s.addText('Your trips, expenses, and reimbursements compiled into a clean PDF — or exported to Excel — in two taps. Includes employee number, mileage rate, and signed totals.', {
    x: 0.6, y: 3.1, w: 11, h: 1, fontFace: fontSans, fontSize: 16, color: COL.inkSoft,
  });

  const formats = [
    { name: 'PDF', color: COL.accent, title: 'For SARS & Employers', desc: 'Branded, printable, with header (driver, employee no., period), summary, full trip log, and signed totals.' },
    { name: 'CSV', color: COL.secondary, title: 'For Spreadsheets', desc: 'Excel-compatible. Open in Sheets or hand to your accountant for further analysis.' },
    { name: 'JSON', color: COL.info, title: 'Full Data Export', desc: 'Your POPIA right to data portability. Vehicles, trips, locations, teams, settings — all in one file.' },
  ];
  formats.forEach((f, i) => {
    const x = 0.6 + i * 4.2, y = 4.3;
    s.addShape('roundRect', { x, y, w: 4, h: 2.5, fill: { color: COL.paper }, line: { color: COL.line, width: 1 }, rectRadius: 0.15 });
    s.addText(f.name, { x: x + 0.3, y: y + 0.2, w: 3.5, h: 0.7, fontFace: fontSerif, fontSize: 32, color: f.color, bold: true });
    s.addText(f.title, { x: x + 0.3, y: y + 1.1, w: 3.5, h: 0.4, fontFace: fontSans, fontSize: 14, color: COL.ink, bold: true });
    s.addText(f.desc, { x: x + 0.3, y: y + 1.55, w: 3.5, h: 0.9, fontFace: fontSans, fontSize: 11, color: COL.inkSoft });
  });
}

// ─── Slide 8: Teams ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addText('TEAMS & FLEET MANAGEMENT', { x: 0.6, y: 0.5, w: 8, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Bring your ', options: { color: COL.cream } },
    { text: 'whole fleet', options: { color: COL.accent, italic: true } },
    { text: ' into one place.', options: { color: COL.cream } },
  ], { x: 0.6, y: 1, w: 12, h: 1.5, fontFace: fontSerif, fontSize: 44 });

  s.addText('Pro and Business plans unlock Teams — share a workplace, set custom mileage rates, invite drivers via email, and view their trips to the shared destination.', {
    x: 0.6, y: 2.5, w: 11, h: 1, fontFace: fontSans, fontSize: 14, color: COL.cream, transparency: 30,
  });

  // Team card mockup
  s.addShape('roundRect', { x: 0.6, y: 3.8, w: 6.2, h: 3.4, fill: { color: '1A1A22' }, line: { color: '2A2A30', width: 1 }, rectRadius: 0.15 });
  s.addText('SALES TEAM · 5 MEMBERS', { x: 0.85, y: 4, w: 5.7, h: 0.4, fontFace: fontSans, fontSize: 12, color: COL.cream, transparency: 25, charSpacing: 2 });

  const members = [
    { initial: 'T', name: 'Thabo Molefe', km: '312 km this month', role: 'Admin', color: COL.secondary },
    { initial: 'N', name: 'Naledi Khumalo', km: '487 km this month', role: 'Member', color: COL.accent },
    { initial: 'S', name: 'Sipho Ndlovu', km: '204 km this month', role: 'Member', color: COL.info },
  ];
  members.forEach((m, i) => {
    const y = 4.5 + i * 0.85;
    // Avatar
    s.addShape('ellipse', { x: 0.85, y, w: 0.55, h: 0.55, fill: { color: m.color }, line: { color: m.color } });
    s.addText(m.initial, { x: 0.85, y, w: 0.55, h: 0.55, fontFace: fontSans, fontSize: 20, color: COL.white, bold: true, align: 'center', valign: 'middle' });
    // Name
    s.addText(m.name, { x: 1.55, y: y - 0.05, w: 3.3, h: 0.35, fontFace: fontSans, fontSize: 14, color: COL.cream, bold: true });
    s.addText(m.km, { x: 1.55, y: y + 0.25, w: 3.3, h: 0.3, fontFace: fontSans, fontSize: 11, color: COL.cream, transparency: 35 });
    // Role badge
    s.addShape('roundRect', { x: 5.25, y: y + 0.1, w: 1.3, h: 0.4, fill: { color: m.color }, line: { color: m.color }, rectRadius: 0.2 });
    s.addText(m.role, { x: 5.25, y: y + 0.1, w: 1.3, h: 0.4, fontFace: fontSans, fontSize: 10, color: COL.white, bold: true, align: 'center', valign: 'middle' });
  });

  // Right side KV list
  const kvs = [
    { k: 'Workplace', v: 'Shared address used by all members' },
    { k: 'Rate', v: 'Standard SARS, custom, or none' },
    { k: 'Invites', v: 'Email link to bring members on board' },
    { k: 'Roles', v: 'Admin and Member permissions' },
  ];
  kvs.forEach((kv, i) => {
    const y = 3.8 + i * 0.85;
    s.addText(kv.k, { x: 7.2, y, w: 1.8, h: 0.4, fontFace: fontSerif, fontSize: 22, italic: true, color: COL.accent });
    s.addText(kv.v, { x: 9.2, y: y + 0.05, w: 4, h: 0.4, fontFace: fontSans, fontSize: 13, color: COL.cream });
    if (i < kvs.length - 1) {
      s.addShape('rect', { x: 7.2, y: y + 0.55, w: 6, h: 0.01, fill: { color: COL.cream, transparency: 90 }, line: { color: COL.cream, transparency: 100 } });
    }
  });
}

// ─── Slide 9: Pricing ───────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.light };
  s.addText('SUBSCRIPTION PLANS', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText('Start free.\nScale when you need to.', { x: 0.6, y: 1, w: 12, h: 1.6, fontFace: fontSerif, fontSize: 50, color: COL.ink });
  s.addText('All prices in ZAR. Billed monthly via PayFast. Cancel anytime.', {
    x: 0.6, y: 2.7, w: 11, h: 0.4, fontFace: fontSans, fontSize: 14, color: COL.inkSoft,
  });

  const tiers = [
    { name: 'Free', price: 'R 0', period: 'forever', features: ['3 vehicles', 'Manual logging', 'Basic reports', '30-day history'], featured: false },
    { name: 'Starter', price: 'R 75', period: 'per month', features: ['5 vehicles', 'GPS tracking', 'Expense tracking', 'Full history', 'PDF reports'], featured: false },
    { name: 'Pro', price: 'R 99', period: 'per month', features: ['10 vehicles', 'GPS tracking', 'Teams (5 members)', 'Custom rates', 'Advanced reports', 'Priority support'], featured: true },
    { name: 'Business', price: 'R 249', period: 'per month', features: ['Unlimited everything', 'Admin dashboard', 'API access', 'Bulk reporting', 'Dedicated support'], featured: false },
  ];
  tiers.forEach((t, i) => {
    const x = 0.6 + i * 3.2;
    const y = t.featured ? 3.3 : 3.5;
    const h = t.featured ? 3.9 : 3.7;
    s.addShape('roundRect', { x, y, w: 3, h, fill: { color: COL.paper }, line: { color: t.featured ? COL.accent : COL.line, width: t.featured ? 2 : 1 }, rectRadius: 0.15 });
    if (t.featured) {
      s.addShape('roundRect', { x: x + 0.5, y: y - 0.15, w: 2, h: 0.3, fill: { color: COL.accent }, line: { color: COL.accent }, rectRadius: 0.15 });
      s.addText('MOST POPULAR', { x: x + 0.5, y: y - 0.15, w: 2, h: 0.3, fontFace: fontSans, fontSize: 9, color: COL.white, bold: true, align: 'center', valign: 'middle', charSpacing: 1.5 });
    }
    s.addText(t.name, { x: x + 0.2, y: y + 0.2, w: 2.6, h: 0.5, fontFace: fontSerif, fontSize: 24, color: COL.ink, align: 'center' });
    s.addText(t.price, { x: x + 0.2, y: y + 0.7, w: 2.6, h: 0.5, fontFace: fontSans, fontSize: 22, color: COL.accent, bold: true, align: 'center' });
    s.addText(t.period, { x: x + 0.2, y: y + 1.2, w: 2.6, h: 0.3, fontFace: fontSans, fontSize: 11, color: COL.inkMuted, align: 'center' });
    t.features.forEach((feat, fi) => {
      s.addText('✓  ' + feat, { x: x + 0.3, y: y + 1.7 + fi * 0.3, w: 2.5, h: 0.3, fontFace: fontSans, fontSize: 11, color: COL.inkSoft });
    });
  });
}

// ─── Slide 10: Tech Stack ───────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addText("HOW IT'S BUILT", { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Modern stack,\n', options: { color: COL.cream } },
    { text: 'local-first', options: { color: COL.accent, italic: true } },
    { text: '.', options: { color: COL.cream } },
  ], { x: 0.6, y: 1, w: 12, h: 2, fontFace: fontSerif, fontSize: 56 });
  s.addText('Built with proven, scalable, secure tools. Available on Android, web, and (soon) iOS.', {
    x: 0.6, y: 2.9, w: 11, h: 0.7, fontFace: fontSans, fontSize: 16, color: COL.cream, transparency: 30,
  });

  const stack = [
    { k: 'App',        v: 'React Native + Expo', vSub: 'Same codebase for Android, iOS, web' },
    { k: 'Backend',    v: 'Supabase',            vSub: 'PostgreSQL with row-level security, encrypted at rest' },
    { k: 'Hosting',    v: 'Vercel',              vSub: 'Global CDN, automatic SSL, instant deploys' },
    { k: 'Payments',   v: 'PayFast',             vSub: 'South African PCI-DSS compliant processor' },
    { k: 'Compliance', v: 'POPIA',               vSub: 'Privacy policy, data portability, deletion rights' },
  ];
  stack.forEach((row, i) => {
    const y = 4 + i * 0.55;
    s.addText(row.k, { x: 0.6, y, w: 2.2, h: 0.4, fontFace: fontSerif, fontSize: 22, italic: true, color: COL.accent });
    s.addText(row.v, { x: 3, y, w: 3, h: 0.4, fontFace: fontSans, fontSize: 16, color: COL.cream, bold: true });
    s.addText(row.vSub, { x: 6.2, y: y + 0.05, w: 6.5, h: 0.4, fontFace: fontSans, fontSize: 13, color: COL.cream, transparency: 35 });
    if (i < stack.length - 1) {
      s.addShape('rect', { x: 0.6, y: y + 0.5, w: 12, h: 0.01, fill: { color: COL.cream, transparency: 92 }, line: { color: COL.cream, transparency: 100 } });
    }
  });
}

// ─── Slide 11: Roadmap ──────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.light };
  s.addText("WHAT'S NEXT", { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'The road ', options: { color: COL.ink } },
    { text: 'ahead', options: { color: COL.accent, italic: true } },
    { text: '.', options: { color: COL.ink } },
  ], { x: 0.6, y: 1, w: 12, h: 1.5, fontFace: fontSerif, fontSize: 48 });

  const cols = [
    { title: 'NOW LIVE', titleColor: COL.accent, borderColor: COL.accent, items: ['✓  Android app (EAS build)', '✓  Web at intracklog.com', '✓  GPS & manual logging', '✓  Teams & invitations', '✓  PDF / CSV reports', '✓  PayFast subscriptions', '✓  POPIA-compliant'] },
    { title: 'Q2 2026',  titleColor: COL.secondary, borderColor: COL.line, items: ['○  iOS App Store launch', '○  Background GPS tracking', '○  Push notifications', '○  Branded company reports', '○  Receipt OCR (auto-fill)', '○  SARS direct submission API'] },
    { title: 'FUTURE',   titleColor: COL.info, borderColor: COL.line, items: ['○  Bank/card auto-import', '○  Insurance integration', '○  Maintenance reminders', '○  Driver scoring & insights', '○  Multi-currency', '○  White-label for fleets'] },
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.2;
    s.addShape('roundRect', { x, y: 3, w: 4, h: 4, fill: { color: COL.paper }, line: { color: c.borderColor, width: c.borderColor === COL.accent ? 2 : 1 }, rectRadius: 0.12 });
    s.addText(c.title, { x: x + 0.3, y: 3.2, w: 3.6, h: 0.4, fontFace: fontSans, fontSize: 12, color: c.titleColor, bold: true, charSpacing: 2 });
    c.items.forEach((item, ii) => {
      s.addText(item, { x: x + 0.3, y: 3.7 + ii * 0.4, w: 3.6, h: 0.3, fontFace: fontSans, fontSize: 11, color: COL.inkSoft });
    });
  });
}

// ─── Slide 12: Call to Action ───────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.secondary };
  s.addText('READY TO ROLL', { x: 1, y: 1.5, w: 11.3, h: 0.4, fontFace: fontSans, fontSize: 12, color: COL.cream, charSpacing: 6, align: 'center' });
  s.addText([
    { text: "Let's get you\n", options: { color: COL.cream } },
    { text: 'on track', options: { color: COL.bgDark, italic: true } },
    { text: '.', options: { color: COL.cream } },
  ], { x: 1, y: 2, w: 11.3, h: 2.8, fontFace: fontSerif, fontSize: 90, align: 'center' });
  s.addText('Try the free plan today. No card needed.', { x: 1, y: 5, w: 11.3, h: 0.5, fontFace: fontSans, fontSize: 20, color: COL.cream, align: 'center' });

  // CTA buttons
  s.addShape('roundRect', { x: 4.5, y: 5.8, w: 2, h: 0.6, fill: { color: COL.bgDark }, line: { color: COL.bgDark }, rectRadius: 0.3 });
  s.addText('Get Started', { x: 4.5, y: 5.8, w: 2, h: 0.6, fontFace: fontSans, fontSize: 13, color: COL.white, bold: true, align: 'center', valign: 'middle' });

  s.addShape('roundRect', { x: 6.7, y: 5.8, w: 2.5, h: 0.6, fill: { color: COL.secondary }, line: { color: COL.cream, width: 2 }, rectRadius: 0.3 });
  s.addText('Visit intracklog.com', { x: 6.7, y: 5.8, w: 2.5, h: 0.6, fontFace: fontSans, fontSize: 13, color: COL.cream, bold: true, align: 'center', valign: 'middle' });

  s.addText('Contact:  support@intracklog.com  ·  privacy@intracklog.com', {
    x: 1, y: 6.8, w: 11.3, h: 0.4, fontFace: fontSans, fontSize: 12, color: COL.cream, align: 'center',
  });
}

// ─── Slide 13: Thank You ────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addText([
    { text: 'In', options: { color: COL.inkMuted, bold: true } },
    { text: 'Track', options: { color: COL.accent, bold: true } },
    { text: 'Log', options: { color: COL.secondary, italic: true } },
  ], { x: 4.7, y: 1.2, w: 4, h: 0.8, fontFace: fontSerif, fontSize: 42, align: 'center' });

  s.addText('Thank you.', { x: 1, y: 2.5, w: 11.3, h: 1.6, fontFace: fontSerif, fontSize: 96, color: COL.cream, align: 'center' });
  s.addText("Questions? We're listening.", { x: 1, y: 4.3, w: 11.3, h: 0.5, fontFace: fontSans, fontSize: 18, color: COL.cream, transparency: 30, align: 'center' });

  // 3 contact columns
  const contacts = [
    { label: 'WEB', value: 'intracklog.com' },
    { label: 'EMAIL', value: 'support@intracklog.com' },
    { label: 'PRIVACY', value: 'privacy@intracklog.com' },
  ];
  contacts.forEach((c, i) => {
    const x = 1.5 + i * 3.6;
    s.addText(c.label, { x, y: 5.6, w: 3, h: 0.3, fontFace: fontSans, fontSize: 11, color: COL.cream, transparency: 50, charSpacing: 2, align: 'center' });
    s.addText(c.value, { x, y: 6, w: 3, h: 0.5, fontFace: fontSerif, fontSize: 22, color: COL.cream, align: 'center' });
  });
}

// ─── Save ───────────────────────────────────────────────────────
pres.writeFile({ fileName: 'InTrackLog-Presentation.pptx' }).then((file) => {
  console.log('✅  Created:', file);
});
