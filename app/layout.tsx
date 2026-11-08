import type { Metadata, Viewport } from "next";
import { getContent } from "@/lib/storage";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const description = c.hero.intro;
  return {
    title: { default: c.centreName, template: `%s · ${c.centreName}` },
    description,
    openGraph: { title: c.centreName, description, type: "website" },
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
