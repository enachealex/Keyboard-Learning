/**
 * Full Version (Family package) purchase configuration.
 *
 * ── PASTE YOUR STRIPE PAYMENT LINK BELOW ─────────────────────────────
 * Create it in Stripe: Product Catalog → Add product ("Key Buddy —
 * Family License", $19.99 one-time) → Create payment link. Paste the
 * https://buy.stripe.com/… URL between the quotes and redeploy.
 * Until then, the buy button falls back to a purchase email.
 */
export const FAMILY_PAYMENT_URL = '';

export const FAMILY_PRICE = '$19.99';

export const PURCHASE_EMAIL = 'enachealex1@gmail.com';

/** Where the desktop app sends people to purchase (opens in their browser). */
export const FULL_VERSION_PAGE_URL = 'https://keybuddy.thejumpvault.com/#full-version';

export function purchaseMailto() {
  const subject = 'Key Buddy Full Version — Family purchase';
  const body = [
    'Hi,',
    '',
    `I'd like to buy the Family package (${FAMILY_PRICE}).`,
    'Please send my payment link.',
    '',
    'Name: ',
  ].join('\n');
  return `mailto:${PURCHASE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
