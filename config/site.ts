/**
 * Settings that live in the code on purpose.
 *
 * Bank details are deliberately NOT editable in the admin panel: if an admin
 * login were ever compromised, nobody could redirect bank transfers.
 * Change them here and redeploy.
 */
export const BANK_DETAILS = {
  accountName: "[ACCOUNT NAME]",
  sortCode: "[00-00-00]",
  accountNumber: "[00000000]",
  reference: "DONATION + your surname",
} as const;

export const DONATION_RULES = {
  /** Preset amounts in pounds. */
  monthlyPresets: [5, 10, 25, 50],
  oneOffPresets: [10, 25, 50, 100],
  defaultMonthly: 10,
  defaultOneOff: 25,
  minAmount: 1,
  maxAmount: 10000,
  /** Fixed-length options offered for monthly gifts. */
  durationOptions: [3, 6, 12],
  minMonths: 2,
  maxMonths: 120,
  /**
   * A new Direct Debit mandate takes about 5 working days before money can
   * leave the donor's account, so the first collection date offered is at
   * least this many calendar days away.
   */
  ddEarliestDays: 10,
  /**
   * Stripe requests a Bacs payment and the money leaves the donor's account
   * about 2 working days later. We request it this many calendar days before
   * the date the donor picked, so the money leaves on (or very close to) it.
   */
  ddLeadDays: 3,
  /** Card subscriptions: first charge at least this many days away. */
  cardEarliestDays: 2,
} as const;
