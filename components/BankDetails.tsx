"use client";

import { useState } from "react";
import { BANK_DETAILS } from "@/config/site";

const ROWS = [
  { label: "Account name", value: BANK_DETAILS.accountName },
  { label: "Sort code", value: BANK_DETAILS.sortCode },
  { label: "Account number", value: BANK_DETAILS.accountNumber },
  { label: "Reference", value: BANK_DETAILS.reference },
];

export function BankDetails() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 2000);
    } catch {
      /* Clipboard blocked: the value is still visible to copy by hand. */
    }
  }

  return (
    <div className="bank rv">
      <div className="bank-head">
        <h3>
          Prefer a <span className="serif">bank transfer?</span>
        </h3>
        <p>Use the reference below so we can thank you.</p>
      </div>
      <dl>
        {ROWS.map((r) => (
          <div key={r.label} className="bank-item">
            <div style={{ minWidth: 0 }}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
            <button
              type="button"
              className={`copy ${copied === r.label ? "done" : ""}`}
              aria-label={`Copy ${r.label.toLowerCase()}`}
              onClick={() => copy(r.label, r.value)}
            >
              {copied === r.label ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </dl>
      <p className="sr-only" aria-live="polite">{copied ? `${copied} copied` : ""}</p>
    </div>
  );
}
