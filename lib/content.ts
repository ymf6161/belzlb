/**
 * Everything on the landing page that admins can edit.
 * Stored as one JSON document (see lib/storage.ts), no database.
 */

export type Activity = {
  id: string;
  day: string;
  title: string;
  description: string;
  time: string;
};

export type Photo = { id: string; src: string; alt: string };

export type Testimonial = { id: string; quote: string; name: string; role: string };

export type SiteContent = {
  centreName: string;
  area: string;
  charityNumber: string;
  openingNote: string;
  branding: {
    /** Logo shown in the header. */
    logo: string;
    /** Hide the centre name next to the logo when the logo already includes it. */
    logoIncludesName: boolean;
    /** Small icon shown in the browser tab. */
    favicon: string;
  };
  hero: {
    /** Use *asterisks* around words to set them in the italic serif. */
    headline: string;
    intro: string;
    image: string;
    imageAlt: string;
  };
  about: {
    headline: string;
    body1: string;
    body2: string;
    image: string;
    imageAlt: string;
  };
  whatsOn: Activity[];
  gallery: Photo[];
  testimonials: Testimonial[];
  visit: {
    address: string;
    phone: string;
    email: string;
    hours: string;
    access: string;
    mapEmbedUrl: string;
  };
  social: { facebook: string; instagram: string };
  donations: { giftAidEnabled: boolean };
  updatedAt: string | null;
  updatedBy: string | null;
};

export const DEFAULT_CONTENT: SiteContent = {
  centreName: "[Centre name]",
  area: "[Area]",
  charityNumber: "[NUMBER]",
  openingNote: "Open Monday to Saturday",
  branding: { logo: "", logoIncludesName: false, favicon: "" },
  hero: {
    headline: "Where the whole neighbourhood *comes together.*",
    intro:
      "Classes, clubs, warm meals and a friendly face, run by volunteers and kept going by people like you.",
    image: "",
    imageAlt: "",
  },
  about: {
    headline:
      "Since [YEAR], we've been a place to *meet, learn and belong* in the heart of [Area].",
    body1:
      "[Two or three sentences on who you are, who comes through the door, and why the centre matters to them.]",
    body2:
      "[A sentence on how the centre is run, for example by a small team and [NUMBER] volunteers, and that every donation helps keep it open.]",
    image: "",
    imageAlt: "",
  },
  whatsOn: [
    { id: "a1", day: "Monday", title: "Toddler group", description: "Play, songs and a cuppa for parents and carers of under-5s.", time: "10:00–11:30" },
    { id: "a2", day: "Tuesday", title: "Community lunch club", description: "A hot two-course meal and good company.", time: "12:00–14:00" },
    { id: "a3", day: "Wednesday", title: "Gentle exercise", description: "Seated and standing movement for all abilities.", time: "18:00–19:00" },
    { id: "a4", day: "Thursday", title: "Youth club", description: "Games, homework help and a safe space for ages 11–16.", time: "16:00–18:00" },
    { id: "a5", day: "Friday", title: "Coffee morning", description: "Pop in for a chat, a biscuit and the local news.", time: "10:00–12:00" },
    { id: "a6", day: "Saturday", title: "Digital help drop-in", description: "Bring your phone or laptop for friendly one-to-one help.", time: "11:00–13:00" },
  ],
  gallery: [],
  testimonials: [
    { id: "t1", quote: "[A short quote from someone who uses the centre.]", name: "[First name]", role: "[Group they attend]" },
    { id: "t2", quote: "[A short quote from one of your volunteers.]", name: "[First name]", role: "Volunteer" },
    { id: "t3", quote: "[A short quote from a parent, carer or local partner.]", name: "[First name]", role: "[Relationship to the centre]" },
  ],
  visit: {
    address: "[Street address]\n[Town]\n[Postcode]",
    phone: "[Phone number]",
    email: "[Email address]",
    hours: "Mon–Fri · [HOURS]\nSat · [HOURS]\nSun · Closed",
    access: "[Step-free entrance, accessible toilet, hearing loop, parking: list what applies]",
    mapEmbedUrl: "",
  },
  social: { facebook: "", instagram: "" },
  donations: { giftAidEnabled: false },
  updatedAt: null,
  updatedBy: null,
};

/* ── Validation ─────────────────────────────────────────────
   Content comes from the admin panel, so every field is checked and
   trimmed to a sensible length before it is saved. */

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.slice(0, max).replace(/\r\n/g, "\n") : "";

const id = (v: unknown): string => {
  const s = str(v, 40).replace(/[^a-zA-Z0-9_-]/g, "");
  return s || Math.random().toString(36).slice(2, 10);
};

/** Images must be ones uploaded through the admin panel. */
export function safeImageUrl(v: unknown): string {
  const s = str(v, 600).trim();
  if (!s) return "";
  // Only photos uploaded through the admin panel.
  return /^\/media\/[0-9]+-[a-f0-9]{12}\.(jpg|png|webp|avif|svg|ico)$/.test(s) ? s : "";
}

export function safeMapUrl(v: unknown): string {
  const s = str(v, 2000).trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    if (
      u.protocol === "https:" &&
      (u.hostname === "www.google.com" || u.hostname === "maps.google.com") &&
      u.pathname.startsWith("/maps/embed")
    )
      return u.toString();
  } catch {}
  return "";
}

function safeLink(v: unknown): string {
  const s = str(v, 300).trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.protocol === "https:") return u.toString();
  } catch {}
  return "";
}

export function sanitizeContent(input: unknown, previous: SiteContent): SiteContent {
  const i = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const hero = i.hero ?? {};
  const about = i.about ?? {};
  const visit = i.visit ?? {};
  const social = i.social ?? {};
  const branding = i.branding ?? {};
  const donations = i.donations ?? {};
  const list = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max) : []);

  return {
    centreName: str(i.centreName, 80) || previous.centreName,
    area: str(i.area, 80),
    charityNumber: str(i.charityNumber, 40),
    openingNote: str(i.openingNote, 80),
    branding: {
      logo: safeImageUrl(branding.logo),
      logoIncludesName: branding.logoIncludesName === true,
      favicon: safeImageUrl(branding.favicon),
    },
    hero: {
      headline: str(hero.headline, 140),
      intro: str(hero.intro, 400),
      image: safeImageUrl(hero.image),
      imageAlt: str(hero.imageAlt, 200),
    },
    about: {
      headline: str(about.headline, 220),
      body1: str(about.body1, 1200),
      body2: str(about.body2, 1200),
      image: safeImageUrl(about.image),
      imageAlt: str(about.imageAlt, 200),
    },
    whatsOn: list(i.whatsOn, 30).map((a: any) => ({
      id: id(a?.id),
      day: str(a?.day, 30),
      title: str(a?.title, 80),
      description: str(a?.description, 240),
      time: str(a?.time, 40),
    })),
    gallery: list(i.gallery, 24)
      .map((p: any) => ({ id: id(p?.id), src: safeImageUrl(p?.src), alt: str(p?.alt, 200) }))
      .filter((p) => p.src),
    testimonials: list(i.testimonials, 12).map((t: any) => ({
      id: id(t?.id),
      quote: str(t?.quote, 400),
      name: str(t?.name, 60),
      role: str(t?.role, 80),
    })),
    visit: {
      address: str(visit.address, 300),
      phone: str(visit.phone, 40),
      email: str(visit.email, 120),
      hours: str(visit.hours, 400),
      access: str(visit.access, 400),
      mapEmbedUrl: safeMapUrl(visit.mapEmbedUrl),
    },
    social: { facebook: safeLink(social.facebook), instagram: safeLink(social.instagram) },
    donations: { giftAidEnabled: donations.giftAidEnabled === true },
    updatedAt: previous.updatedAt,
    updatedBy: previous.updatedBy,
  };
}

/** Fill any fields missing from an older saved file with the defaults. */
export function withDefaults(saved: Partial<SiteContent> | null): SiteContent {
  if (!saved) return DEFAULT_CONTENT;
  return {
    ...DEFAULT_CONTENT,
    ...saved,
    hero: { ...DEFAULT_CONTENT.hero, ...saved.hero },
    about: { ...DEFAULT_CONTENT.about, ...saved.about },
    visit: { ...DEFAULT_CONTENT.visit, ...saved.visit },
    social: { ...DEFAULT_CONTENT.social, ...saved.social },
    branding: { ...DEFAULT_CONTENT.branding, ...saved.branding },
    donations: { ...DEFAULT_CONTENT.donations, ...saved.donations },
  };
}
