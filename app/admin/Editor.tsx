"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useState } from "react";
import type { Activity, Photo, SiteContent, Testimonial } from "@/lib/content";

type Tab = "general" | "hero" | "whatson" | "photos" | "quotes" | "visit" | "donations";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "hero", label: "Hero & About" },
  { id: "whatson", label: "What’s on" },
  { id: "photos", label: "Photos" },
  { id: "quotes", label: "Testimonials" },
  { id: "visit", label: "Visit & contact" },
  { id: "donations", label: "Donations" },
];

const newId = () => Math.random().toString(36).slice(2, 10);

export function Editor({ initial, admin }: { initial: SiteContent; admin: string }) {
  const [c, setC] = useState<SiteContent>(initial);
  const [saved, setSaved] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<Tab>("general");
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "ok" | "error"; msg?: string }>({ kind: "idle" });
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setC((p) => ({ ...p, [key]: value }));
  const setIn = <K extends "hero" | "about" | "visit" | "social" | "donations" | "branding">(
    key: K,
    field: keyof SiteContent[K],
    value: unknown,
  ) => setC((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));

  async function save() {
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setStatus({ kind: "error", msg: data.error });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Saving failed.");
      setC(data.content);
      setSaved(data.content);
      setStatus({ kind: "ok", msg: "Saved. The website is updated." });
    } catch (err: any) {
      setStatus({ kind: "error", msg: err.message });
    }
  }

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-brand">
          <span className="dot" aria-hidden="true" />
          <span>{saved.centreName}</span>
        </div>
        <nav aria-label="Sections" className="tabs">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener" className="a-link">View website ↗</a>
          <span className="muted small">Signed in as {admin}</span>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="a-link">Log out</button>
          </form>
        </div>
      </aside>

      <main className="panel">
        <div className="bar">
          <div>
            <h1>{TABS.find((t) => t.id === tab)?.label}</h1>
            {saved.updatedAt && (
              <p className="muted small">
                Last saved {new Date(saved.updatedAt).toLocaleString("en-GB")} by {saved.updatedBy}
              </p>
            )}
          </div>
          <div className="bar-actions">
            {status.kind !== "idle" && (
              <span className={`status ${status.kind}`} role="status">
                {status.kind === "saving" ? "Saving…" : status.msg}
                {status.kind === "error" && status.msg?.includes("log in") && (
                  <> <a href="/admin/login" className="a-link">Log in</a></>
                )}
              </span>
            )}
            {dirty && status.kind !== "saving" && <span className="status idle">Unsaved changes</span>}
            <button type="button" className="a-btn ghost" disabled={!dirty} onClick={() => { setC(saved); setStatus({ kind: "idle" }); }}>
              Discard
            </button>
            <button type="button" className="a-btn primary" disabled={!dirty || status.kind === "saving"} onClick={save}>
              Save changes
            </button>
          </div>
        </div>

        <div className="content fade" key={tab}>
          {tab === "general" && (
            <Section title="Centre details">
              <Field label="Centre name" value={c.centreName} onChange={(v) => set("centreName", v)} max={80} />
              <Field label="Area or neighbourhood" value={c.area} onChange={(v) => set("area", v)} max={80} />
              <Field label="Registered charity number" value={c.charityNumber} onChange={(v) => set("charityNumber", v)} max={40} />
              <Field
                label="Opening note"
                hint="The small line above the headline, e.g. “Open Monday to Saturday”."
                value={c.openingNote}
                onChange={(v) => set("openingNote", v)}
                max={80}
              />
              <Field label="Facebook page link" placeholder="https://facebook.com/…" value={c.social.facebook} onChange={(v) => setIn("social", "facebook", v)} max={300} />
              <Field label="Instagram link" placeholder="https://instagram.com/…" value={c.social.instagram} onChange={(v) => setIn("social", "instagram", v)} max={300} />
            </Section>
          )}
          {tab === "general" && (
            <Section title="Logo & favicon">
              <ImageField
                label="Logo"
                value={c.branding.logo}
                onChange={(v) => setIn("branding", "logo", v)}
                hint="Shown at the top of every page. PNG with a transparent background or SVG works best, under 4 MB."
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                fit="contain"
              />
              {c.branding.logo && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={c.branding.logoIncludesName}
                    onChange={(e) => setIn("branding", "logoIncludesName", e.target.checked)}
                  />
                  <span>My logo already includes the centre’s name (hide the name next to it)</span>
                </label>
              )}
              <ImageField
                label="Favicon (browser tab icon)"
                value={c.branding.favicon}
                onChange={(v) => setIn("branding", "favicon", v)}
                hint="A small square icon. Use a square PNG of at least 512 × 512 pixels, or an ICO or SVG file."
                accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
                fit="contain"
              />
            </Section>
          )}

          {tab === "hero" && (
            <>
              <Section title="Top of the page" hint="Put *asterisks* around words to show them in the elegant italic.">
                <Field label="Headline" value={c.hero.headline} onChange={(v) => setIn("hero", "headline", v)} max={140} />
                <Field label="Introduction" value={c.hero.intro} onChange={(v) => setIn("hero", "intro", v)} max={400} multiline />
                <ImageField label="Main photo" value={c.hero.image} onChange={(v) => setIn("hero", "image", v)} />
                <Field label="Photo description (for screen readers)" value={c.hero.imageAlt} onChange={(v) => setIn("hero", "imageAlt", v)} max={200} />
              </Section>
              <Section title="About us">
                <Field label="Headline" value={c.about.headline} onChange={(v) => setIn("about", "headline", v)} max={220} multiline />
                <Field label="First paragraph" value={c.about.body1} onChange={(v) => setIn("about", "body1", v)} max={1200} multiline />
                <Field label="Second paragraph" value={c.about.body2} onChange={(v) => setIn("about", "body2", v)} max={1200} multiline />
                <ImageField label="Photo" value={c.about.image} onChange={(v) => setIn("about", "image", v)} />
                <Field label="Photo description" value={c.about.imageAlt} onChange={(v) => setIn("about", "imageAlt", v)} max={200} />
              </Section>
            </>
          )}

          {tab === "whatson" && (
            <ListEditor<Activity>
              items={c.whatsOn}
              onChange={(v) => set("whatsOn", v)}
              addLabel="Add an activity"
              max={30}
              blank={() => ({ id: newId(), day: "", title: "", description: "", time: "" })}
              title={(a) => a.title || "New activity"}
              render={(a, update) => (
                <div className="grid2">
                  <Field label="Day" placeholder="e.g. Monday, or 1st Saturday" value={a.day} onChange={(v) => update({ day: v })} max={30} />
                  <Field label="Time" placeholder="e.g. 10:00–11:30" value={a.time} onChange={(v) => update({ time: v })} max={40} />
                  <div className="span2"><Field label="Activity name" value={a.title} onChange={(v) => update({ title: v })} max={80} /></div>
                  <div className="span2"><Field label="Short description" value={a.description} onChange={(v) => update({ description: v })} max={240} multiline /></div>
                </div>
              )}
            />
          )}

          {tab === "photos" && (
            <>
              <p className="muted">These appear in the “Life at the centre” gallery. The first photo is shown larger.</p>
              <ListEditor<Photo>
                items={c.gallery}
                onChange={(v) => set("gallery", v)}
                addLabel="Add a photo"
                max={24}
                blank={() => ({ id: newId(), src: "", alt: "" })}
                title={(p, i) => p.alt || `Photo ${i + 1}`}
                render={(p, update) => (
                  <>
                    <ImageField label="Image" value={p.src} onChange={(v) => update({ src: v })} />
                    <Field label="Description (for screen readers)" value={p.alt} onChange={(v) => update({ alt: v })} max={200} />
                  </>
                )}
              />
              {c.gallery.some((p) => !p.src) && (
                <p className="muted small">Photos without an uploaded image are left out when you save.</p>
              )}
            </>
          )}

          {tab === "quotes" && (
            <ListEditor<Testimonial>
              items={c.testimonials}
              onChange={(v) => set("testimonials", v)}
              addLabel="Add a testimonial"
              max={12}
              blank={() => ({ id: newId(), quote: "", name: "", role: "" })}
              title={(t) => t.name || "New testimonial"}
              render={(t, update) => (
                <div className="grid2">
                  <div className="span2"><Field label="Quote" value={t.quote} onChange={(v) => update({ quote: v })} max={400} multiline /></div>
                  <Field label="Name" placeholder="First name is fine" value={t.name} onChange={(v) => update({ name: v })} max={60} />
                  <Field label="Who they are" placeholder="e.g. Lunch club regular" value={t.role} onChange={(v) => update({ role: v })} max={80} />
                </div>
              )}
            />
          )}

          {tab === "visit" && (
            <Section title="Visit & contact">
              <Field label="Address" value={c.visit.address} onChange={(v) => setIn("visit", "address", v)} max={300} multiline />
              <div className="grid2">
                <Field label="Phone" value={c.visit.phone} onChange={(v) => setIn("visit", "phone", v)} max={40} />
                <Field label="Email" value={c.visit.email} onChange={(v) => setIn("visit", "email", v)} max={120} />
              </div>
              <Field label="Opening hours" hint="One line per day or group of days." value={c.visit.hours} onChange={(v) => setIn("visit", "hours", v)} max={400} multiline />
              <Field label="Access information" value={c.visit.access} onChange={(v) => setIn("visit", "access", v)} max={400} multiline />
              <Field
                label="Google Maps embed link"
                hint="In Google Maps: Share → Embed a map → copy the link inside src=&quot;…&quot;. It starts with https://www.google.com/maps/embed"
                placeholder="https://www.google.com/maps/embed?pb=…"
                value={c.visit.mapEmbedUrl}
                onChange={(v) => setIn("visit", "mapEmbedUrl", v)}
                max={2000}
              />
            </Section>
          )}

          {tab === "donations" && (
            <Section title="Gift Aid">
              <div className={`toggle-card ${c.donations.giftAidEnabled ? "on" : ""}`}>
                <div>
                  <strong>Show the Gift Aid option on the donation form</strong>
                  <p className="muted small">
                    Only switch this on once the charity is registered with HMRC for Gift Aid. Every admin gets an
                    email whenever this setting changes.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.donations.giftAidEnabled}
                  aria-label="Gift Aid on the donation form"
                  className="switch"
                  onClick={() => setIn("donations", "giftAidEnabled", !c.donations.giftAidEnabled)}
                >
                  <span />
                </button>
              </div>
              <p className="muted small">
                Gift Aid declarations (name, home address, postcode and date) are saved on each donor’s record in
                Stripe, under Customers → Metadata. Bank details are fixed in the website code for security and
                can’t be changed here.
              </p>
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Building blocks ───────────────────────────────────── */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="a-section">
      <h2>{title}</h2>
      {hint && <p className="muted small">{hint}</p>}
      <div className="stack">{children}</div>
    </section>
  );
}


function Field({
  label, value, onChange, hint, placeholder, max, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; max: number; multiline?: boolean;
}) {
  const id = useId();
  return (
    <div className="a-field">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="muted small">{hint}</span>}
      {multiline ? (
        <textarea id={id} className="a-input" rows={3} maxLength={max} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="a-input" maxLength={max} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  hint = "JPG, PNG or WebP, under 4 MB. Landscape works best.",
  accept = "image/jpeg,image/png,image/webp,image/avif",
  fit = "cover",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  accept?: string;
  fit?: "cover" | "contain";
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="a-field">
      <span className="label">{label}</span>
      <div className="image-field">
        <div className={`thumb ${fit === "contain" ? "contain" : ""}`}>{value ? <img src={value} alt="" /> : <span className="muted small">No image</span>}</div>
        <div className="image-actions">
          <label htmlFor={id} className="a-btn ghost">{busy ? "Uploading…" : value ? "Replace image" : "Upload image"}</label>
          <input
            id={id}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
          />
          {value && <button type="button" className="a-link" onClick={() => onChange("")}>Remove</button>}
          <span className="muted small">{hint}</span>
          {error && <span className="alert small" role="alert">{error}</span>}
        </div>
      </div>
    </div>
  );
}

function ListEditor<T extends { id: string }>({
  items, onChange, blank, render, title, addLabel, max,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  blank: () => T;
  render: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  title: (item: T, index: number) => string;
  addLabel: string;
  max: number;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="stack">
      {items.length === 0 && <p className="muted">Nothing here yet.</p>}
      {items.map((item, i) => (
        <div key={item.id} className="item">
          <div className="item-head">
            <strong>{title(item, i)}</strong>
            <div className="item-tools">
              <button type="button" className="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="icon" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button
                type="button"
                className="a-link danger"
                onClick={() => { if (confirm("Remove this item? You can still discard before saving.")) onChange(items.filter((x) => x.id !== item.id)); }}
              >
                Remove
              </button>
            </div>
          </div>
          <div className="stack">{render(item, (patch) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...patch } : x))))}</div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="a-btn ghost add" onClick={() => onChange([...items, blank()])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}
