import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { validateServerEnvironment } from "@/lib/supabase/config";
import {
  PHONE,
  CONTACT_EMAIL,
  SOCIAL_LINKS,
  DEFAULT_SERVICE_AREA,
} from "@/lib/constants/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SudsOnWheels — Mobile Pressure Washing | Ashland, OH",
    template: "%s | SudsOnWheels",
  },
  description:
    "Professional mobile pressure washing serving Ashland and North Central Ohio. Houses, driveways, decks, gutters, and commercial fleet washing. Free quotes.",
  metadataBase: new URL("https://sudsonwheelsusa.com"),
  openGraph: {
    siteName: "SudsOnWheels",
    locale: "en_US",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SudsOnWheels",
  url: "https://sudsonwheelsusa.com",
  telephone: `+1${PHONE}`,
  email: CONTACT_EMAIL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ashland",
    addressRegion: "OH",
    addressCountry: "US",
  },
  areaServed: DEFAULT_SERVICE_AREA.map((city) => ({
    "@type": "City",
    name: city,
  })),
  sameAs: SOCIAL_LINKS.map((link) => link.href),
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  validateServerEnvironment();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
