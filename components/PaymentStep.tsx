"use client";

import { useState } from "react";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";

/* Load Stripe.js once per page, not on every render. */
let stripePromise: Promise<Stripe | null> | null = null;
let loadedKey = "";
function getStripe(key: string) {
  if (!stripePromise || loadedKey !== key) {
    loadedKey = key;
    stripePromise = loadStripe(key, { locale: "en-GB" });
  }
  return stripePromise;
}

/* Stripe's payment fields, styled to match the rest of the donation card. */
const appearance: Appearance = {
  theme: "stripe",
  variables: {
    fontFamily: "Assistant, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSizeBase: "16px",
    colorPrimary: "#8A3C18",
    colorBackground: "#FFFBF4",
    colorText: "#3B1D0E",
    colorTextSecondary: "#6E4E3A",
    colorTextPlaceholder: "#9C8270",
    colorDanger: "#A3261B",
    colorIcon: "#8A3C18",
    borderRadius: "14px",
    spacingUnit: "4px",
    gridRowSpacing: "16px",
    focusBoxShadow: "0 0 0 3px rgba(210, 144, 72, 0.35)",
    focusOutline: "none",
  },
  rules: {
    ".Input": { border: "1px solid rgba(138, 60, 24, 0.3)", boxShadow: "none", padding: "13px 14px" },
    ".Input:focus": { border: "1px solid #8A3C18" },
    ".Input--invalid": { border: "1px solid #A3261B" },
    ".Label": { fontSize: "13px", fontWeight: "600", color: "#6E4E3A", marginBottom: "6px" },
    ".Tab": { border: "1px solid rgba(138, 60, 24, 0.25)", borderRadius: "18px", boxShadow: "none", color: "#8A3C18" },
    ".Tab:hover": { border: "1px solid #8A3C18" },
    ".Tab--selected": { border: "1px solid #8A3C18", backgroundColor: "#8A3C18", color: "#FFFBF4" },
    ".Tab--selected .TabIcon": { fill: "#FFFBF4" },
    ".Tab--selected .TabLabel": { color: "#FFFBF4" },
    ".AccordionItem": { border: "1px solid rgba(138, 60, 24, 0.25)", borderRadius: "18px", boxShadow: "none" },
  },
};

const fonts = [{ cssSrc: "https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" }];

type Props = {
  clientSecret: string;
  publishableKey: string;
  summaryHead: string;
  summaryDetail: string;
  ctaLabel: string;
  onBack: () => void;
};

export function PaymentStep(props: Props) {
  return (
    <CheckoutElementsProvider
      stripe={getStripe(props.publishableKey)}
      options={{ clientSecret: props.clientSecret, elementsOptions: { appearance, fonts, loader: "never" } }}
    >
      <PaymentForm {...props} />
    </CheckoutElementsProvider>
  );
}

function PaymentForm({ summaryHead, summaryDetail, ctaLabel, onBack }: Props) {
  const state = useCheckoutElements();
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  if (state.type === "error") {
    return (
      <div className="card-stack fade">
        <p role="alert" className="error">
          The payment form couldn’t load: {state.error.message}
        </p>
        <button type="button" className="a-back" onClick={onBack}>← Back to your gift</button>
      </div>
    );
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (state.type !== "success" || paying) return;
    setPaying(true);
    setError("");
    // Stays on the page for cards; goes to the bank or wallet and back only when it must.
    const result = await state.checkout.confirm({ redirect: "if_required" });
    if (result.type === "error") {
      setError(result.error.message);
      setPaying(false);
      return;
    }
    window.location.assign(`/thank-you?session_id=${encodeURIComponent(result.session.id)}`);
  }

  const loading = state.type === "loading" || !ready;

  return (
    <form className="card-stack fade" onSubmit={pay} noValidate>
      <div className="pay-head">
        <button type="button" className="a-back" onClick={onBack} disabled={paying}>
          ← Change your gift
        </button>
        <p className="pay-summary">
          <strong>{summaryHead}.</strong> {summaryDetail}
        </p>
      </div>

      <div>
        <span className="legend">Payment details</span>
        <div className="pay-element">
          {loading && <div className="pay-skeleton" aria-hidden="true"><span /><span /><span /></div>}
          {state.type === "success" && (
            <div className={ready ? "fade" : ""} style={ready ? undefined : { height: 0, overflow: "hidden" }}>
              <PaymentElement
                options={{ layout: "tabs" }}
                onReady={() => setReady(true)}
                onChange={(ev) => setComplete(ev.complete)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="summary" style={{ borderTop: 0, paddingTop: 0 }}>
        {error && <p role="alert" className="error fade">{error}</p>}
        <button type="submit" className="cta" disabled={loading || !complete || paying}>
          <span>{paying ? "Processing…" : ctaLabel}</span>
          <span className="ba" aria-hidden="true">→</span>
        </button>
        <p className="secure">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          Secured by Stripe. Your card and bank details go straight to Stripe, never to us.
        </p>
      </div>
    </form>
  );
}
