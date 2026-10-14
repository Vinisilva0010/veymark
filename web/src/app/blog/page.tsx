import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

const CORAL = "#f73962";
const WINE = "#500414";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "How counterfeit car parts reach the market, what they cost the manufacturer whose name is on them, and what cryptographic identity per part changes.",
  alternates: { canonical: "https://www.veymark.xyz/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-5xl px-6 py-32 md:py-40" style={{ color: WINE }}>
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: CORAL }}
      >
        Blog
      </p>

      <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-6xl">
        Counterfeit parts, and what proof actually costs
      </h1>

      <p className="mt-7 max-w-2xl text-xl font-medium leading-snug md:text-2xl">
        How fakes reach the market, who pays when they fail, and what changes
        when every part carries an identity that cannot be photographed.
      </p>

      {posts.length === 0 ? (
        <p className="mt-16 text-lg font-medium">Nothing published yet.</p>
      ) : (
        <div className="mt-16 grid gap-10 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="block">
                {post.cover && (
                  <img
                    src={post.cover}
                    alt={post.coverAlt}
                    className="aspect-[16/9] w-full rounded-2xl object-cover"
                    style={{ border: `2px solid ${WINE}20` }}
                  />
                )}

                <p
                  className="mt-5 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ color: CORAL }}
                >
                  {post.date} · {post.readingMinutes} min read
                </p>

                <h2 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">
                  {post.title}
                </h2>

                <p className="mt-3 text-lg font-medium leading-relaxed">
                  {post.description}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
