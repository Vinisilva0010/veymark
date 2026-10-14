import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost, getRelated } from "@/lib/blog";

const CORAL = "#f73962";
const WINE = "#500414";
const SITE = "https://www.veymark.xyz";

const AUTHOR = {
  name: "Vinicius S. Pontual",
  url: "https://viniciuspontual.zanvexis.com/en/sobre",
  jobTitle: "Co-founder",
  bio: "Systems engineer. Three years building on Solana in Rust, Anchor and Go, with a focus on smart contract auditing and security layers. Wrote the Veymark tag cryptography, the Anchor program and the verification layer.",
};

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE}/blog/${slug}` },
    openGraph: {
      type: "article",
      url: `${SITE}/blog/${slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [AUTHOR.name],
      images: [{ url: post.cover, alt: post.coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.cover],
    },
  };
}

export default async function BlogPost({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = getRelated(post);

  // Three blocks of structured data, each doing one job: the article itself,
  // the questions at the end, and the trail back to the blog. Google reads
  // all three; the FAQ block is the one most often quoted back by AI answers.
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${SITE}/blog/${slug}/#article`,
        headline: post.title,
        description: post.description,
        image: [`${SITE}${post.cover}`],
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        author: [
          {
            "@type": "Person",
            name: AUTHOR.name,
            jobTitle: AUTHOR.jobTitle,
            url: AUTHOR.url,
          },
        ],
        publisher: { "@id": `${SITE}/#organization` },
        mainEntityOfPage: `${SITE}/blog/${slug}`,
      },
      ...(post.faq.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: post.faq.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: post.title },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-32 md:py-40" style={{ color: WINE }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <nav className="text-sm font-semibold" style={{ color: CORAL }}>
        <Link href="/blog">Blog</Link>
      </nav>

      <h1 className="mt-4 text-4xl font-bold leading-[1.1] md:text-5xl">
        {post.title}
      </h1>

      <p className="mt-5 text-base font-semibold" style={{ color: WINE }}>
        {AUTHOR.name} · {post.date}
        {post.updated && ` · updated ${post.updated}`} · {post.readingMinutes} min
        read
      </p>

      {post.cover && (
        <img
          src={post.cover}
          alt={post.coverAlt}
          className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover"
          style={{ border: `2px solid ${WINE}20` }}
        />
      )}

      {/* The answer before the article. This is the block a search engine or
          an AI answer pulls when it quotes the page. */}
      {post.summary && (
        <div
          className="mt-10 rounded-2xl p-6"
          style={{ background: "#ffffff", border: `2px solid ${WINE}` }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: CORAL }}
          >
            In short
          </p>
          <p className="mt-3 text-lg font-semibold leading-relaxed">
            {post.summary}
          </p>
        </div>
      )}

      {post.headings.length > 2 && (
        <nav className="mt-10">
          <p className="text-lg font-bold">On this page</p>
          <ul className="mt-3 space-y-2">
            {post.headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="text-base font-semibold underline"
                  style={{ color: WINE }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <article
        className="vm-prose mt-12"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {post.faq.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl font-bold leading-tight">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-8">
            {post.faq.map((f) => (
              <div key={f.question}>
                <h3 className="text-xl font-bold">{f.question}</h3>
                <p className="mt-2 text-lg font-medium leading-relaxed">
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {post.sources.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">Sources</h2>
          <ul className="mt-4 space-y-2">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold underline"
                  style={{ color: WINE }}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        className="mt-16 rounded-2xl p-6"
        style={{ background: "#ffffff", border: `2px solid ${WINE}20` }}
      >
        <p className="text-lg font-bold">{AUTHOR.name}</p>
        <p className="text-base font-semibold" style={{ color: CORAL }}>
          {AUTHOR.jobTitle}, Veymark
        </p>
        <p className="mt-3 text-base font-medium leading-relaxed">
          {AUTHOR.bio}
        </p>
        <a
          href={AUTHOR.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-base font-bold underline"
          style={{ color: WINE }}
        >
          More about the author
        </a>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">Keep reading</h2>
          <ul className="mt-5 space-y-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/blog/${r.slug}`}
                  className="text-lg font-bold underline"
                  style={{ color: WINE }}
                >
                  {r.title}
                </Link>
                <p className="mt-1 text-base font-medium">{r.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-16">
        <Link
          href="/"
          className="inline-block rounded-xl px-8 py-4 text-lg font-bold text-white"
          style={{ background: CORAL }}
        >
          See how Veymark works
        </Link>
      </section>
    </main>
  );
}
