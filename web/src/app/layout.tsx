import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";
import StructuredData from "@/components/StructuredData";
import "./globals.css";

const SITE = "https://www.veymark.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),

  // What someone types into a search box, not what reads well on the page.
  title: {
    default: "Veymark — Car parts you can verify by tapping your phone",
    template: "%s | Veymark",
  },

  description:
    "A cryptographic chip on each car part and a passport minted per unit on Solana. Tap a phone to the part and see if it is genuine, who made it, and what is inside it. No app, no wallet, no account.",

  keywords: [
    "counterfeit car parts",
    "auto parts authentication",
    "NFC tag verification",
    "anti-counterfeiting",
    "Solana",
    "product authentication",
  ],

  // The site answers on www. Without this, both versions get indexed and the
  // ranking is split between them.
  alternates: {
    canonical: SITE,
  },

  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Veymark",
    title: "Veymark — Car parts you can verify by tapping your phone",
    description:
      "A cryptographic chip on each car part and a passport minted per unit on Solana. Tap a phone to the part and see if it is genuine.",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Veymark",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@veymark_xyz",
    creator: "@veymark_xyz",
    title: "Veymark — Car parts you can verify by tapping your phone",
    description:
      "A cryptographic chip on each car part and a passport minted per unit on Solana.",
    images: ["/images/logo.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  verification: {
    google: "Bhc99_aBi340q8LPKfKzZXRXFBfhvC3T6fZa4ieNufk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen antialiased">
        <StructuredData />
        <SiteChrome />
        {children}
      </body>
    </html>
  );
}
