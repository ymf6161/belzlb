import { getContent } from "@/lib/storage";
import { AnimatedWords, Emphasis } from "@/components/Emphasis";
import { Media } from "@/components/Media";
import { Testimonials } from "@/components/Testimonials";
import { DonateForm } from "@/components/DonateForm";
import { BankDetails } from "@/components/BankDetails";

// Always render with the latest content saved in the admin panel.
export const dynamic = "force-dynamic";

export default async function Home() {
  const c = await getContent();
  const marquee = c.whatsOn.map((a) => a.title).filter(Boolean);
  const nameParts = c.centreName.trim().split(/\s+/);
  const lastWord = nameParts.length > 1 ? nameParts.pop() : "";

  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>

      <header className="header">
        <div className="header-bar">
          <a href="#top" className="brand">
            <span className="brand-dot" aria-hidden="true" />
            {c.centreName}
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#about">About</a>
            <a href="#whatson">What&apos;s on</a>
            {(c.gallery.length > 0 || c.testimonials.length > 0) && <a href="#stories">Stories</a>}
            <a href="#visit">Visit</a>
            <a href="#donate" className="btn btn-dark btn-sm">
              Donate <span className="ba" aria-hidden="true">→</span>
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section id="top" className="hero">
          <div className="wrap">
            {c.openingNote && (
              <div className="status fade">
                <span className="status-dot" aria-hidden="true" />
                {c.openingNote}
              </div>
            )}
            <h1>
              <AnimatedWords text={c.hero.headline || c.centreName} />
            </h1>
            <div className="hero-foot">
              <p className="hero-intro fade" style={{ animationDelay: ".7s" }}>{c.hero.intro}</p>
              <div className="actions fade" style={{ animationDelay: ".85s" }}>
                <a href="#donate" className="btn btn-dark">
                  Support the centre <span className="ba" aria-hidden="true">→</span>
                </a>
                <a href="#whatson" className="btn btn-ghost">See what&apos;s on</a>
              </div>
            </div>
          </div>
          <div className="wrap hero-media" style={{ marginTop: 0 }}>
            <Media
              src={c.hero.image}
              alt={c.hero.imageAlt}
              label="Hero photo: add one in the admin panel"
              className="fade"
              style={{ width: "100%", height: "clamp(280px, 42vw, 560px)", animationDelay: ".9s" }}
              priority
            />
            <div className="badge" aria-hidden="true">
              <svg className="ring" width="132" height="132" viewBox="0 0 132 132">
                <defs>
                  <path id="circ" d="M66,66 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" />
                </defs>
                <text style={{ fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: 500, letterSpacing: 3.2, textTransform: "uppercase" }} fill="#0E0F0C">
                  <textPath href="#circ">Give · Gather · Belong · Give · Gather · Belong ·</textPath>
                </text>
              </svg>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0E0F0C" strokeWidth="1.6">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
            </div>
          </div>
        </section>

        {marquee.length > 0 && (
          <div className="marquee-wrap" aria-hidden="true">
            <div className="marquee">
              {[0, 1].flatMap((round) =>
                marquee.flatMap((t, i) => [
                  <span key={`${round}-${i}`}>{t}</span>,
                  <span key={`${round}-${i}-s`} className="sep">✦</span>,
                ]),
              )}
            </div>
          </div>
        )}

        {/* About */}
        <section id="about" className="section">
          <div className="wrap about">
            <div className="about-side rv">
              <p className="eyebrow">(01) — About us</p>
            </div>
            <div className="about-main">
              <h2 className="rv"><Emphasis text={c.about.headline} /></h2>
              <div className="two-col rv">
                {c.about.body1 && <p>{c.about.body1}</p>}
                {c.about.body2 && <p>{c.about.body2}</p>}
              </div>
              <Media
                src={c.about.image}
                alt={c.about.imageAlt}
                label="Photo: the building or volunteers"
                className="rv"
                style={{ marginTop: 56, aspectRatio: "16 / 9", borderRadius: 28 }}
              />
            </div>
          </div>
        </section>

        {/* What's on */}
        {c.whatsOn.length > 0 && (
          <section id="whatson" className="section whatson">
            <div className="wrap">
              <div className="head-row rv">
                <div>
                  <p className="eyebrow">(02) — What&apos;s on</p>
                  <h2 className="h2">Every week, <span className="serif">something for everyone</span></h2>
                </div>
              </div>
              <div className="rows">
                {c.whatsOn.map((a) => (
                  <article key={a.id} className="row rv">
                    <span className="day">{a.day}</span>
                    <h3 className="title">{a.title}</h3>
                    <p className="desc">{a.description}</p>
                    <span className="time">{a.time}</span>
                    <span className="arrow" aria-hidden="true">→</span>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery & testimonials */}
        {(c.gallery.length > 0 || c.testimonials.length > 0) && (
          <section id="stories" className="section">
            <div className="wrap">
              <div className="rv" style={{ marginBottom: 56 }}>
                <p className="eyebrow">(03) — Stories</p>
                <h2 className="h2">Life at <span className="serif">the centre</span></h2>
              </div>
              {c.gallery.length > 0 && (
                <div className="bento">
                  {c.gallery.map((p) => (
                    <Media key={p.id} src={p.src} alt={p.alt} label="" className="rv" />
                  ))}
                </div>
              )}
              <Testimonials items={c.testimonials} />
            </div>
          </section>
        )}

        {/* Donate */}
        <section id="donate" className="section donate on-dark">
          <div className="wrap donate-grid">
            <div className="donate-intro rv">
              <p className="eyebrow">(04) — Donate</p>
              <h2>Help keep <span className="serif">our doors open.</span></h2>
              <p>
                Every gift pays for the heating, the meals and the activities that bring people together. A regular
                gift lets us plan ahead.
              </p>
              <ul className="promises">
                <li><b>01</b><span>Secure payments by Stripe. We never see or store your card or bank details.</span></li>
                <li><b>02</b><span>Direct Debits are protected by the Direct Debit Guarantee.</span></li>
                <li><b>03</b><span>Change, pause or cancel a monthly gift any time.</span></li>
              </ul>
            </div>
            <div className="donate-col">
              <DonateForm giftAidEnabled={c.donations.giftAidEnabled} />
              <BankDetails />
            </div>
          </div>
        </section>

        {/* Visit */}
        <section id="visit" className="visit-outer">
          <div className="wrap">
            <div className="visit-card">
              <div className="visit-info rv">
                <div>
                  <p className="eyebrow">(05) — Visit</p>
                  <h2 className="h2">Come and <span className="serif">say hello</span></h2>
                </div>
                <div className="info-grid">
                  {c.visit.address && (
                    <div><h3>Address</h3><p>{c.visit.address}</p></div>
                  )}
                  {(c.visit.phone || c.visit.email) && (
                    <div>
                      <h3>Contact</h3>
                      <p>
                        {c.visit.phone && <a href={`tel:${c.visit.phone.replace(/[^\d+]/g, "")}`}>{c.visit.phone}</a>}
                        {c.visit.phone && c.visit.email && <br />}
                        {c.visit.email && <a href={`mailto:${c.visit.email}`}>{c.visit.email}</a>}
                      </p>
                    </div>
                  )}
                  {c.visit.hours && (
                    <div><h3>Opening hours</h3><p>{c.visit.hours}</p></div>
                  )}
                  {c.visit.access && (
                    <div><h3>Access</h3><p>{c.visit.access}</p></div>
                  )}
                </div>
              </div>
              <div className="media map rv">
                {c.visit.mapEmbedUrl ? (
                  <iframe
                    src={c.visit.mapEmbedUrl}
                    title={`Map showing ${c.centreName}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="inner ph" style={{ alignItems: "center", justifyContent: "center" }} aria-hidden="true">
                    <span className="chip">Map: add a Google Maps embed link in the admin panel</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer on-dark">
        <div className="wrap">
          <div className="footer-mark" aria-hidden="true">
            {nameParts.join(" ")} {lastWord && <span className="serif">{lastWord}</span>}
          </div>
          <div className="footer-row">
            <span>
              {c.centreName}
              {c.charityNumber && ` · Registered charity no. ${c.charityNumber}`}
            </span>
            <nav aria-label="Footer">
              {c.social.facebook && <a href={c.social.facebook} rel="noopener noreferrer" target="_blank">Facebook</a>}
              {c.social.instagram && <a href={c.social.instagram} rel="noopener noreferrer" target="_blank">Instagram</a>}
              <a href="/privacy">Privacy</a>
              <a href="#donate" className="accent">Donate →</a>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
