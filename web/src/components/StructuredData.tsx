/**
 * Structured data for search engines.
 *
 * Tells Google this is an organisation and a software product rather than a
 * page of text, which is what lets a knowledge panel and richer results
 * appear. Invisible to anyone reading the page.
 */

const SITE = "https://www.veymark.xyz";

const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Veymark",
      url: SITE,
      logo: `${SITE}/images/logo.png`,
      description:
        "Per-unit identity for car parts. A cryptographic chip on the part and a passport minted per unit on Solana.",
      foundingDate: "2026",
      sameAs: [
        "https://x.com/veymark_xyz",
        "https://www.linkedin.com/company/veymark-xyz",
        "https://github.com/Vinisilva0010/veymark",
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "BR",
        addressRegion: "SP",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Veymark",
      publisher: { "@id": `${SITE}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: "Veymark",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      url: SITE,
      description:
        "Authentication for physical car parts. A cryptographic chip proves the part without exposing its key, and each unit gets a passport on Solana that anyone can read.",
      publisher: { "@id": `${SITE}/#organization` },
    },
  ],
};

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
