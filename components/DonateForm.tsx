"use client";

import { useMemo, useState } from "react";
import { DONATION_RULES } from "@/config/site";
import { formatDay, monthlySchedule, money, ordinal, type Method } from "@/lib/donation";

type Freq = "monthly" | "once";
type Duration = "ongoing" | "3" | "6" | "12" | "custom";

export function DonateForm({ giftAidEnabled }: { giftAidEnabled: boolean }) {
  const [freq, setFreq] = useState<Freq>("monthly");
  const [preset, setPreset] = useState<number>(DONATION_RULES.defaultMonthly);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<Method>("dd");
  const [day, setDay] = useState(1);
  const [duration, setDuration] = useState<Duration>("ongoing");
  const [months, setMonths] = useState("");
  const [giftAid, setGiftAid] = useState(false);
  const [gaName, setGaName] = useState("");
  const [gaAddress, setGaAddress] = useState("");
  const [gaPostcode, setGaPostcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const monthly = freq === "monthly";
  const payMethod: Method = monthly ? method : "card";
  const presets = monthly ? DONATION_RULES.monthlyPresets : DONATION_RULES.oneOffPresets;

  const amount = custom !== "" ? Number(custom) : preset;
  const amountOk =
    Number.isFinite(amount) && amount >= DONATION_RULES.minAmount && amount <= DONATION_RULES.maxAmount;

  const nMonths =
    duration === "ongoing" ? null : duration === "custom" ? parseInt(months, 10) : parseInt(duration, 10);
  const monthsOk =
    duration !== "custom" ||
    (Number.isInteger(nMonths) && nMonths! >= DONATION_RULES.minMonths && nMonths! <= DONATION_RULES.maxMonths);

  const schedule = useMemo(
    () => monthlySchedule(day, payMethod, monthsOk ? nMonths : null),
    [day, payMethod, nMonths, monthsOk],
  );

  const showGiftAid = giftAidEnabled;
  const claimingGiftAid = showGiftAid && giftAid;
  const gaMissing = claimingGiftAid && (!gaName.trim() || !gaAddress.trim() || !gaPostcode.trim());

  let error = "";
  if (custom !== "" && !amountOk)
    error = `Please enter an amount between £${DONATION_RULES.minAmount} and £${DONATION_RULES.maxAmount.toLocaleString("en-GB")}.`;
  else if (monthly && !monthsOk)
    error = `Enter a number of months between ${DONATION_RULES.minMonths} and ${DONATION_RULES.maxMonths}.`;
  else if (gaMissing) error = "Add your full name, home address and postcode so we can claim Gift Aid.";
  const blocked = !amountOk || (monthly && !monthsOk) || gaMissing || submitting;

  const amtText = amountOk ? money(amount) : "£—";
  const bigText = amountOk ? `£${amount % 1 ? amount.toFixed(2) : amount.toFixed(0)}` : "£—";

  let summaryHead: string;
  let summaryDetail: string;
  if (monthly) {
    summaryHead = `${amtText} every month`;
    const how = payMethod === "dd" ? "by Direct Debit" : "by card";
    const length =
      nMonths && monthsOk && schedule.lastLeave
        ? `${nMonths} payments, the last on ${formatDay(schedule.lastLeave)}.`
        : "Continues until you cancel.";
    summaryDetail = `Paid ${how} on the ${ordinal(day)}, starting ${formatDay(schedule.firstLeave)}. ${length}`;
  } else {
    summaryHead = `${amtText} one-off gift`;
    summaryDetail = "Paid by card, Apple Pay or Google Pay, taken today.";
  }
  if (claimingGiftAid && amountOk) {
    summaryDetail += ` Plus ${money(amount * 0.25)} Gift Aid${monthly ? " each month" : ""} from HMRC.`;
  }

  const ctaLabel = submitting
    ? "Opening secure checkout…"
    : !monthly
      ? `Donate ${amtText} now`
      : payMethod === "dd"
        ? "Set up Direct Debit"
        : "Continue to card payment";

  function switchFreq(f: Freq) {
    setFreq(f);
    setCustom("");
    setPreset(f === "monthly" ? DONATION_RULES.defaultMonthly : DONATION_RULES.defaultOneOff);
    setServerError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (blocked) return;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freq,
          amount,
          method: payMethod,
          day,
          months: monthly ? nMonths : null,
          giftAid: claimingGiftAid
            ? { name: gaName.trim(), address: gaAddress.trim(), postcode: gaPostcode.trim() }
            : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Something went wrong. Please try again.");
      window.location.assign(data.url);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="card rv" onSubmit={submit} noValidate>
      <div className="card-stack">
        <div className="seg" role="group" aria-label="How often">
          <span className={`seg-slider ${monthly ? "" : "right"}`} aria-hidden="true" />
          <button type="button" aria-pressed={monthly} onClick={() => switchFreq("monthly")}>Monthly</button>
          <button type="button" aria-pressed={!monthly} onClick={() => switchFreq("once")}>One-off</button>
        </div>

        <div className="big">
          <small>{monthly ? "Your monthly gift" : "Your one-off gift"}</small>
          <output key={bigText + freq} className="fade" aria-live="polite">
            {bigText}
            {monthly && <span className="serif">/ month</span>}
          </output>
        </div>

        <fieldset>
          <legend className="legend">01 · Amount</legend>
          <div className="presets">
            {presets.map((v) => (
              <button
                key={v}
                type="button"
                className="opt"
                aria-pressed={custom === "" && preset === v}
                onClick={() => { setPreset(v); setCustom(""); }}
              >
                £{v}
              </button>
            ))}
          </div>
          <div className="other">
            <label htmlFor="custom-amount">Other amount £</label>
            <input
              id="custom-amount"
              type="number"
              inputMode="decimal"
              min={DONATION_RULES.minAmount}
              max={DONATION_RULES.maxAmount}
              step="0.01"
              placeholder="0.00"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
        </fieldset>

        {monthly ? (
          <div className="card-stack fade">
            <fieldset>
              <legend className="legend">02 · Pay by</legend>
              <div className="methods">
                <button type="button" className="method" aria-pressed={method === "dd"} onClick={() => setMethod("dd")}>
                  <span className="top">Direct Debit <span className="radio" /></span>
                  <span className="sub">From your bank account. Lowest fees, so more reaches us.</span>
                </button>
                <button type="button" className="method" aria-pressed={method === "card"} onClick={() => setMethod("card")}>
                  <span className="top">Card <span className="radio" /></span>
                  <span className="sub">Debit or credit card, charged each month.</span>
                </button>
              </div>
            </fieldset>

            <div>
              <label className="legend" htmlFor="collect-day">03 · Collection day</label>
              <div className="day-row">
                <select
                  id="collect-day"
                  className="pill-select"
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>The {ordinal(d)}</option>
                  ))}
                </select>
                <span style={{ fontSize: 15, color: "var(--muted)" }}>of every month</span>
              </div>
              <p className="help">
                {payMethod === "dd"
                  ? `First collection on ${formatDay(schedule.firstLeave)}. Banks need a few working days to set up a new Direct Debit, so the first one is at least ${DONATION_RULES.ddEarliestDays} days away. If the date falls on a weekend or bank holiday, it leaves on the next working day.`
                  : `First charge on ${formatDay(schedule.firstLeave)}, then on the ${ordinal(day)} of each month.`}
              </p>
            </div>

            <fieldset>
              <legend className="legend">04 · Duration</legend>
              <div className="durations">
                {(["ongoing", "3", "6", "12", "custom"] as Duration[]).map((d) => (
                  <button key={d} type="button" className="opt small" aria-pressed={duration === d} onClick={() => setDuration(d)}>
                    {d === "ongoing" ? "Until I cancel" : d === "custom" ? "Other" : `${d} months`}
                  </button>
                ))}
              </div>
              {duration === "custom" && (
                <div className="inline-field fade">
                  <label htmlFor="custom-months">Number of months</label>
                  <input
                    id="custom-months"
                    className="pill-input"
                    type="number"
                    min={DONATION_RULES.minMonths}
                    max={DONATION_RULES.maxMonths}
                    step="1"
                    placeholder="18"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                  />
                </div>
              )}
            </fieldset>
          </div>
        ) : (
          <p className="note fade">One-off gifts are paid by card, Apple Pay or Google Pay and taken straight away.</p>
        )}

        {showGiftAid && (
          <div className={`giftaid ${giftAid ? "on" : ""}`}>
            <label>
              <input type="checkbox" checked={giftAid} onChange={(e) => setGiftAid(e.target.checked)} />
              <span>
                <span className="t">
                  Boost your gift by <span className="serif">{amountOk ? money(amount * 0.25) : "25%"}</span> with Gift Aid
                </span>
                <span className="d">
                  I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the
                  amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay any
                  difference.
                </span>
              </span>
            </label>
            {giftAid && (
              <div className="fields fade">
                <div className="field full">
                  <label htmlFor="ga-name">Full name</label>
                  <input id="ga-name" className="text-input" autoComplete="name" maxLength={120} value={gaName} onChange={(e) => setGaName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="ga-address">Home address</label>
                  <input id="ga-address" className="text-input" autoComplete="street-address" maxLength={200} value={gaAddress} onChange={(e) => setGaAddress(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="ga-postcode">Postcode</label>
                  <input id="ga-postcode" className="text-input" autoComplete="postal-code" maxLength={10} value={gaPostcode} onChange={(e) => setGaPostcode(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="summary">
          <p><strong>{summaryHead}.</strong> {summaryDetail}</p>
          {(error || serverError) && (
            <p role="alert" className="error fade">{serverError || error}</p>
          )}
          <button type="submit" className="cta" disabled={blocked}>
            <span>{ctaLabel}</span>
            <span className="ba" aria-hidden="true">→</span>
          </button>
          <p className="secure">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            Secure payment by Stripe. Your details never touch our site.
          </p>
        </div>
      </div>
    </form>
  );
}
