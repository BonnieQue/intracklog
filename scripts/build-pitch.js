// 5-minute pitch deck for InTrackLog (6 slides)
// Run: node scripts/build-pitch.js
const PptxGenJS = require('pptxgenjs');

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';
pres.author = 'InTrackLog (Pty) Ltd';
pres.company = 'InTrackLog';
pres.title = 'InTrackLog · 5-Minute Pitch';

const COL = {
  bgDark: '0A0A0C', bgMid: '131318',
  cream: 'F0EFE8', ink: '1A1A1F',
  inkSoft: '4A4A55', inkMuted: '8A8A96',
  accent: '2D9F6F', accentDim: '238A5D',
  secondary: 'E07A3A', secondaryDim: 'C96A30',
  info: '85B7EB', white: 'FFFFFF',
  light: 'F7F6F1', paper: 'FFFFFF', line: 'E2E1DA',
};
const fontSerif = 'Times New Roman';
const fontSans = 'Calibri';

// ─── Slide 1: HOOK ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addShape('ellipse', { x: 9, y: -2, w: 6, h: 6, fill: { color: COL.accent, transparency: 80 }, line: { color: COL.accent, transparency: 100 } });
  s.addShape('ellipse', { x: -2, y: 4, w: 5, h: 5, fill: { color: COL.secondary, transparency: 85 }, line: { color: COL.secondary, transparency: 100 } });

  // Logo
  s.addText([
    { text: 'In', options: { color: COL.inkMuted, bold: true } },
    { text: 'Track', options: { color: COL.accent, bold: true } },
    { text: 'Log', options: { color: COL.secondary, italic: true } },
  ], { x: 0.5, y: 0.5, w: 5, h: 0.7, fontFace: fontSerif, fontSize: 32 });

  s.addText('FOR SOUTH AFRICAN DRIVERS', {
    x: 1.5, y: 2.5, w: 10.3, h: 0.4,
    fontFace: fontSans, fontSize: 12, color: COL.accent,
    charSpacing: 6, align: 'center',
  });

  s.addText([
    { text: 'Drive forward.\n', options: { color: COL.cream } },
    { text: 'Track smart.', options: { color: COL.accent, italic: true } },
  ], {
    x: 1, y: 3, w: 11.3, h: 2.6,
    fontFace: fontSerif, fontSize: 96, align: 'center',
  });

  s.addText('Mileage logging. Expense tracking. SARS reports.\nIn one app, in your pocket.', {
    x: 1.5, y: 5.7, w: 10.3, h: 0.9,
    fontFace: fontSans, fontSize: 18, color: COL.cream,
    transparency: 30, align: 'center',
  });
}

// ─── Slide 2: PROBLEM + SOLUTION ────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.light };

  // Left: problem
  s.addText('THE PROBLEM', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.secondary, charSpacing: 6 });
  s.addText('Drivers still use paper.', { x: 0.6, y: 1, w: 6, h: 1, fontFace: fontSerif, fontSize: 36, color: COL.ink });
  s.addText('Lost logbooks. Spreadsheet panic at year-end. Apps built for the US, not South Africa. Lost reimbursements.', {
    x: 0.6, y: 2, w: 6, h: 1.5, fontFace: fontSans, fontSize: 14, color: COL.inkSoft,
  });
  s.addText('R 4.64', { x: 0.6, y: 3.7, w: 6, h: 1.3, fontFace: fontSerif, fontSize: 88, color: COL.secondary, bold: true });
  s.addText('SARS reimbursement per kilometre — money left on the table without proper records.', {
    x: 0.6, y: 5.1, w: 6, h: 1.2, fontFace: fontSans, fontSize: 13, color: COL.inkMuted,
  });

  // Vertical divider
  s.addShape('rect', { x: 6.65, y: 0.6, w: 0.02, h: 6.3, fill: { color: COL.line }, line: { color: COL.line } });

  // Right: solution
  s.addText('OUR SOLUTION', { x: 7, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'A logbook\nthat ', options: { color: COL.ink } },
    { text: 'tracks itself.', options: { color: COL.accent, italic: true } },
  ], { x: 7, y: 1, w: 6, h: 2, fontFace: fontSerif, fontSize: 36 });

  const points = [
    '✓  Tap once. Drive. The GPS captures everything.',
    '✓  Auto-detects start and end addresses.',
    '✓  Reports come ready for SARS or your employer.',
    '✓  Built in ZAR, paid via PayFast.',
    '✓  POPIA-compliant. Your data stays yours.',
  ];
  points.forEach((p, i) => {
    s.addText(p, { x: 7, y: 3.4 + i * 0.55, w: 6, h: 0.5, fontFace: fontSans, fontSize: 14, color: COL.inkSoft });
  });
}

// ─── Slide 3: HOW IT WORKS (3 STEPS) ────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addText('HOW IT WORKS', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Three taps from\n', options: { color: COL.cream } },
    { text: 'kilometres', options: { color: COL.accent, italic: true } },
    { text: ' to ', options: { color: COL.cream } },
    { text: 'reimbursement', options: { color: COL.accent, italic: true } },
    { text: '.', options: { color: COL.cream } },
  ], { x: 0.6, y: 1, w: 12, h: 1.6, fontFace: fontSerif, fontSize: 44 });

  const steps = [
    { num: '1', title: 'TRACK', desc: 'Tap "Start a trip" before driving. GPS records distance, route, and locations automatically. Or log manually after the fact.' },
    { num: '2', title: 'CAPTURE', desc: 'Add fuel, service, tyres, or toll expenses with photos of receipts. Everything stays organised by vehicle and date.' },
    { num: '3', title: 'EXPORT', desc: 'Generate a SARS-ready PDF (or CSV for your accountant) in two taps. Includes your employee number and signed totals.' },
  ];
  steps.forEach((step, i) => {
    const x = 0.6 + i * 4.2;
    s.addShape('roundRect', { x, y: 3, w: 4, h: 3.8, fill: { color: '1A1A22' }, line: { color: '2A2A30', width: 1 }, rectRadius: 0.15 });
    // Big number circle
    s.addShape('ellipse', { x: x + 0.3, y: 3.3, w: 0.9, h: 0.9, fill: { color: COL.accent }, line: { color: COL.accent } });
    s.addText(step.num, { x: x + 0.3, y: 3.3, w: 0.9, h: 0.9, fontFace: fontSerif, fontSize: 34, color: COL.white, bold: true, align: 'center', valign: 'middle' });
    s.addText(step.title, { x: x + 0.3, y: 4.4, w: 3.5, h: 0.5, fontFace: fontSans, fontSize: 18, color: COL.cream, bold: true, charSpacing: 1.5 });
    s.addText(step.desc, { x: x + 0.3, y: 4.95, w: 3.5, h: 1.7, fontFace: fontSans, fontSize: 12, color: COL.cream, transparency: 30 });
  });
}

// ─── Slide 4: KEY FEATURES (FAST GRID) ──────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.light };
  s.addText('WHAT YOU GET', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Built for the way ', options: { color: COL.ink } },
    { text: 'you actually drive', options: { color: COL.accent, italic: true } },
    { text: '.', options: { color: COL.ink } },
  ], { x: 0.6, y: 1, w: 12, h: 1.5, fontFace: fontSerif, fontSize: 44 });

  const features = [
    { icon: '📍', title: 'GPS Trips', sub: 'Auto-tracked routes' },
    { icon: '🚗', title: 'Multi-vehicle', sub: 'Up to unlimited' },
    { icon: '💰', title: 'Expense logs', sub: 'With receipt photos' },
    { icon: '📄', title: 'PDF reports', sub: 'SARS-ready, branded' },
    { icon: '👥', title: 'Teams', sub: 'Share with colleagues' },
    { icon: '🔒', title: 'POPIA-safe', sub: 'Encrypted, never sold' },
    { icon: '⚙', title: 'Custom rates', sub: 'SARS or your own' },
    { icon: '📊', title: 'Live stats', sub: 'On your dashboard' },
  ];
  features.forEach((f, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.2, y = 3 + row * 1.9;
    s.addShape('roundRect', { x, y, w: 3, h: 1.7, fill: { color: COL.paper }, line: { color: COL.line, width: 1 }, rectRadius: 0.12 });
    s.addText(f.icon, { x: x + 0.2, y: y + 0.2, w: 1, h: 0.8, fontFace: fontSans, fontSize: 32 });
    s.addText(f.title, { x: x + 1.1, y: y + 0.3, w: 1.8, h: 0.4, fontFace: fontSans, fontSize: 14, color: COL.ink, bold: true });
    s.addText(f.sub, { x: x + 1.1, y: y + 0.75, w: 1.8, h: 0.3, fontFace: fontSans, fontSize: 11, color: COL.inkMuted });
  });
}

// ─── Slide 5: PRICING (COMPACT) ─────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.bgDark };
  s.addText('PRICING', { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: fontSans, fontSize: 11, color: COL.accent, charSpacing: 6 });
  s.addText([
    { text: 'Free to start.\n', options: { color: COL.cream } },
    { text: 'R 99/month', options: { color: COL.accent, italic: true } },
    { text: ' for the typical user.', options: { color: COL.cream } },
  ], { x: 0.6, y: 1, w: 12, h: 1.7, fontFace: fontSerif, fontSize: 44 });
  s.addText('All in ZAR. Billed monthly via PayFast. Cancel anytime.', { x: 0.6, y: 2.9, w: 11, h: 0.4, fontFace: fontSans, fontSize: 14, color: COL.cream, transparency: 30 });

  const tiers = [
    { name: 'Free', price: 'R 0', period: 'forever', vehicles: '3 vehicles', best: 'Manual logging' },
    { name: 'Starter', price: 'R 75', period: '/month', vehicles: '5 vehicles', best: 'Add GPS tracking' },
    { name: 'Pro', price: 'R 99', period: '/month', vehicles: '10 vehicles', best: 'Add Teams', featured: true },
    { name: 'Business', price: 'R 249', period: '/month', vehicles: 'Unlimited', best: 'Add API access' },
  ];
  tiers.forEach((t, i) => {
    const x = 0.6 + i * 3.2;
    const y = t.featured ? 3.6 : 3.8;
    const h = t.featured ? 3.4 : 3.2;
    const bg = t.featured ? COL.accent : '1A1A22';
    const border = t.featured ? COL.accent : '2A2A30';
    s.addShape('roundRect', { x, y, w: 3, h, fill: { color: bg }, line: { color: border, width: t.featured ? 2 : 1 }, rectRadius: 0.15 });
    if (t.featured) {
      s.addShape('roundRect', { x: x + 0.5, y: y - 0.2, w: 2, h: 0.36, fill: { color: COL.secondary }, line: { color: COL.secondary }, rectRadius: 0.18 });
      s.addText('MOST POPULAR', { x: x + 0.5, y: y - 0.2, w: 2, h: 0.36, fontFace: fontSans, fontSize: 9, color: COL.white, bold: true, align: 'center', valign: 'middle', charSpacing: 1.5 });
    }
    s.addText(t.name, { x: x + 0.2, y: y + 0.2, w: 2.6, h: 0.5, fontFace: fontSerif, fontSize: 28, color: t.featured ? COL.white : COL.cream, align: 'center' });
    s.addText(t.price, { x: x + 0.2, y: y + 0.85, w: 2.6, h: 0.6, fontFace: fontSans, fontSize: 30, color: t.featured ? COL.white : COL.accent, bold: true, align: 'center' });
    s.addText(t.period, { x: x + 0.2, y: y + 1.45, w: 2.6, h: 0.3, fontFace: fontSans, fontSize: 11, color: t.featured ? COL.white : COL.inkMuted, align: 'center', transparency: t.featured ? 25 : 0 });
    s.addText(t.vehicles, { x: x + 0.2, y: y + 2, w: 2.6, h: 0.4, fontFace: fontSans, fontSize: 13, color: t.featured ? COL.white : COL.cream, bold: true, align: 'center' });
    s.addText(t.best, { x: x + 0.2, y: y + 2.5, w: 2.6, h: 0.4, fontFace: fontSans, fontSize: 11, color: t.featured ? COL.white : COL.cream, transparency: t.featured ? 15 : 30, align: 'center' });
  });
}

// ─── Slide 6: CALL TO ACTION ────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COL.secondary };

  s.addText([
    { text: "Let's get you\n", options: { color: COL.cream } },
    { text: 'on track', options: { color: COL.bgDark, italic: true } },
    { text: '.', options: { color: COL.cream } },
  ], { x: 1, y: 1.5, w: 11.3, h: 2.8, fontFace: fontSerif, fontSize: 100, align: 'center' });

  s.addText('Try the free plan today. No card needed.', { x: 1, y: 4.6, w: 11.3, h: 0.5, fontFace: fontSans, fontSize: 22, color: COL.cream, align: 'center' });

  // Big CTA
  s.addShape('roundRect', { x: 4.7, y: 5.4, w: 4, h: 0.8, fill: { color: COL.bgDark }, line: { color: COL.bgDark }, rectRadius: 0.4 });
  s.addText('intracklog.com', { x: 4.7, y: 5.4, w: 4, h: 0.8, fontFace: fontSans, fontSize: 18, color: COL.cream, bold: true, align: 'center', valign: 'middle' });

  s.addText('support@intracklog.com  ·  privacy@intracklog.com', {
    x: 1, y: 6.5, w: 11.3, h: 0.4, fontFace: fontSans, fontSize: 13, color: COL.cream, align: 'center', transparency: 15,
  });

  // Bottom brand
  s.addText([
    { text: 'In', options: { color: COL.bgDark, bold: true } },
    { text: 'Track', options: { color: COL.cream, bold: true } },
    { text: 'Log', options: { color: COL.bgDark, italic: true } },
  ], { x: 1, y: 0.4, w: 11.3, h: 0.6, fontFace: fontSerif, fontSize: 22, align: 'center' });
}

pres.writeFile({ fileName: 'InTrackLog-Pitch-5min.pptx' }).then((file) => {
  console.log('✅  Created:', file);
});
