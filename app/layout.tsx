import type { Metadata, Viewport } from "next";
import { getContent } from "@/lib/storage";
import "./globals.css";

/** Shown until a favicon is uploaded in the admin panel: the site's lime dot. */
const DEFAULT_FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#0E0F0C"/><circle cx="16" cy="16" r="8" fill="#CFF06A"/></svg>',
  );

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const description = c.hero.intro;
  return {
    title: { default: c.centreName, template: `%s · ${c.centreName}` },
    description,
    openGraph: { title: c.centreName, description, type: "website" },
    icons: c.branding.favicon
      ? { icon: c.branding.favicon, apple: c.branding.favicon }
      : { icon: DEFAULT_FAVICON },
  };
}

export const viewport: Viewport = { themeColor: "#F5F5F2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
