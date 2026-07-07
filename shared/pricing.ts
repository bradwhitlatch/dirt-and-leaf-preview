/**
 * Dirt & Leaf pricing constants — freemium + subscription model.
 *
 * Shared between client and server so paywall copy/limits never drift.
 * See README.md "Pricing & subscriptions" for the full rationale and the
 * real-payment-processing TODO.
 */

export const FREE_PLANT_LIMIT = 3;

export const PREMIUM_MONTHLY_PRICE_USD = 4.99;
export const PREMIUM_YEARLY_PRICE_USD = 39.99;

// Effective monthly cost of the yearly plan, for "Save X%" messaging.
export const PREMIUM_YEARLY_EFFECTIVE_MONTHLY = PREMIUM_YEARLY_PRICE_USD / 12;
export const PREMIUM_YEARLY_SAVINGS_PCT = Math.round(
  (1 - PREMIUM_YEARLY_EFFECTIVE_MONTHLY / PREMIUM_MONTHLY_PRICE_USD) * 100
);

export const PREMIUM_FEATURES = [
  "Unlimited tracked plants with reminders",
  "Full care history & progress log",
  "Priority, more detailed AI plant-ID confidence data",
  "Fertilizer & product recommendations",
  "Advanced notification customization (custom schedules, snooze)",
  "Deep, multi-source care profile data as it becomes available",
];
