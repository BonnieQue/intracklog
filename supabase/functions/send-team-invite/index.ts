// Supabase Edge Function: send-team-invite
// Sends a branded team-invite email via the Resend HTTP API.
//
// Deploy:
//   supabase functions deploy send-team-invite --project-ref qelagdodunhoezcvzimn
// Set the API key as a secret (one-off):
//   supabase secrets set RESEND_API_KEY=re_xxx --project-ref qelagdodunhoezcvzimn
//
// The client invokes it via supabase.functions.invoke('send-team-invite', { body: {...} }).
// Failures are non-fatal in the app — admins can fall back to "Share link".

// deno-lint-ignore-file no-explicit-any
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// IMPORTANT: must match the verified Resend sending domain. Records are scoped
// to the `send` subdomain, so the From address must be @send.intracklog.com or
// SPF/DKIM checks fail at Gmail. Override with the INVITE_FROM secret if your
// verified domain differs.
const FROM_ADDRESS = Deno.env.get('INVITE_FROM') ?? 'InTrackLog <noreply@send.intracklog.com>';

interface InviteBody {
  invite_id: string;
  team_name: string;
  inviter_name?: string;
  recipient_email: string;
  accept_url: string;
}

function emailHtml(b: InviteBody): string {
  const inviter = b.inviter_name ? `${b.inviter_name} has` : 'You have been';
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f1;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:36px 32px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td align="center" style="padding-bottom:20px;">
          <div style="font-size:22px;font-weight:700;">
            <span style="color:#6a6a76;">In</span><span style="color:#52AD3B;">Track</span><span style="color:#E07A3A;">Log</span>
          </div>
          <div style="font-size:10px;letter-spacing:2px;color:#8a8a96;margin-top:4px;">DRIVE FORWARD. TRACK SMART.</div>
        </td></tr>
        <tr><td style="font-size:15px;color:#1a1a1f;line-height:1.6;padding:8px 0 20px;">
          ${inviter} invited you to join <strong>${b.team_name}</strong> on InTrackLog so you can log mileage and submit reimbursement claims to the team.
        </td></tr>
        <tr><td align="center" style="padding-bottom:8px;">
          <a href="${b.accept_url}" style="background:#52AD3B;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;display:inline-block;">Accept invite</a>
        </td></tr>
        <tr><td style="font-size:12px;color:#8a8a96;line-height:1.6;padding-top:16px;">
          If you weren't expecting this, you can safely ignore the email.
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!RESEND_API_KEY) return new Response('RESEND_API_KEY not set', { status: 500 });

  let body: InviteBody;
  try { body = await req.json(); } catch { return new Response('invalid json', { status: 400 }); }
  if (!body.recipient_email || !body.accept_url || !body.team_name) {
    return new Response('missing fields', { status: 400 });
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: body.recipient_email,
      subject: `You've been invited to join ${body.team_name} on InTrackLog`,
      html: emailHtml(body),
    }),
  });

  const text = await resp.text();
  return new Response(text, { status: resp.status, headers: { 'Content-Type': 'application/json' } });
});
