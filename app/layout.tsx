import type { Metadata, Viewport } from "next";
import { getContent } from "@/lib/storage";
import "./globals.css";

/** Shown until a favicon is uploaded in the admin panel: the logo's diamond. */
const DEFAULT_FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="4.7" y="4.7" width="22.6" height="22.6" rx="3" transform="rotate(45 16 16)" fill="#8A3C18"/><rect x="10.3" y="10.3" width="11.4" height="11.4" rx="1.5" transform="rotate(45 16 16)" fill="#D29048"/></svg>',
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

export const viewport: Viewport = { themeColor: "#F6F0E4" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
