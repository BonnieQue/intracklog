import MD5 from 'crypto-js/md5';

// PayFast configuration
// For testing: use public sandbox credentials
// For production: replace with your own merchant credentials and set SANDBOX = false
export const PAYFAST_SANDBOX = true;

// Public sandbox: PayFast's universal test merchant
const SANDBOX_CONFIG = {
  merchant_id: '10000100',
  merchant_key: '46f0cd694581a',
  passphrase: '',
  url: 'https://sandbox.payfast.co.za/eng/process',
};

// Production: same credentials but on the live URL
const PRODUCTION_CONFIG = {
  merchant_id: '11938395',
  merchant_key: 'tl3nanz9byrpe',
  passphrase: '/G0d/n0th1ng1s1mp0ss1bl3',
  url: 'https://www.payfast.co.za/eng/process',
};

export const PAYFAST_CONFIG = PAYFAST_SANDBOX ? SANDBOX_CONFIG : PRODUCTION_CONFIG;

export interface PayFastSubscription {
  amount: number;          // In ZAR
  itemName: string;        // e.g. "Pro Plan - Monthly"
  itemDescription?: string;
  email: string;
  firstName: string;
  lastName?: string;
  customerId: string;      // Our user ID (Supabase auth ID)
  tierKey: string;         // e.g. 'pro'
  returnUrl: string;       // Where to redirect after success
  cancelUrl: string;       // Where to redirect if user cancels
  notifyUrl: string;       // IPN webhook (Supabase Edge Function)
}

/**
 * Build the PayFast checkout HTML form (auto-submits to PayFast).
 * We render this in a WebView and PayFast handles the rest.
 */
export function buildPayFastCheckoutHTML(sub: PayFastSubscription, recurring: boolean = true): string {
  const data: Record<string, string> = {
    merchant_id: PAYFAST_CONFIG.merchant_id,
    merchant_key: PAYFAST_CONFIG.merchant_key,
    return_url: sub.returnUrl,
    cancel_url: sub.cancelUrl,
    notify_url: sub.notifyUrl,
    name_first: sub.firstName,
    name_last: sub.lastName || '',
    email_address: sub.email,
    m_payment_id: `${sub.customerId}_${Date.now()}`,
    amount: sub.amount.toFixed(2),
    item_name: sub.itemName,
    item_description: sub.itemDescription || sub.itemName,
    custom_str1: sub.customerId,
    custom_str2: sub.tierKey,
  };

  if (recurring) {
    data.subscription_type = '1';
    data.frequency = '3';
    data.cycles = '0';
    data.recurring_amount = sub.amount.toFixed(2);
  }

  // Generate signature
  const signature = generateSignature(data, PAYFAST_CONFIG.passphrase);
  data.signature = signature;

  // Build auto-submitting HTML form
  const fields = Object.entries(data)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${escapeHtml(v)}" />`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting to PayFast...</title>
  <style>
    body { margin: 0; padding: 40px 20px; font-family: -apple-system, sans-serif;
           background: #0a0a0c; color: #f0efe8; text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid #52AD3B33;
               border-top-color: #52AD3B; border-radius: 50%;
               animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .msg { font-size: 14px; opacity: 0.7; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <div class="msg">Redirecting to secure PayFast checkout...</div>
  <form id="pf" action="${PAYFAST_CONFIG.url}" method="post">
    ${fields}
  </form>
  <script>document.getElementById('pf').submit();</script>
</body>
</html>`;
}

/**
 * Generate MD5 signature required by PayFast for security.
 * Format: param1=urlencoded_value1&param2=urlencoded_value2[&passphrase=...]
 */
function generateSignature(data: Record<string, string>, passphrase: string = ''): string {
  // Sort keys alphabetically (PayFast requirement) — actually PayFast uses key order
  // but for safety we follow the order we built
  const params = Object.entries(data)
    .filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, '+')}`)
    .join('&');

  const stringToSign = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}` : params;
  return MD5(stringToSign).toString();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
