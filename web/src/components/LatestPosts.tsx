import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

const CORAL = "#f73962";
const WINE = "#500414";

/**
 * The three most recent posts, under the FAQ on the home page.
 *
 * Stacked rather than carousel: a carousel hides most of its content behind
 * an interaction, and what is hidden is not read — by a visitor skimming on a
 * phone or by a crawler.
 */
export default function LatestPosts() {
  const posts = getAllPosts().slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-6 py-24 md:py-32" style={{ color: WINE }}>
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: CORAL }}
      >
        Blog
      </p>

      <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
        Counterfeit parts, and what proof actually costs
      </h2>

      <div className="mt-12 flex flex-col gap-10">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex flex-col gap-5 sm:flex-row sm:items-start"
          >
            {post.cover && (
              <img
                src={post.cover}
                alt={post.coverAlt}
                className="aspect-[16/9] w-full rounded-xl object-cover sm:w-56 sm:shrink-0"
                style={{ border: `2px solid ${WINE}20` }}
              />
            )}

            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: CORAL }}
              >
                {post.date} · {post.readingMinutes} min read
              </p>
              <h3 className="mt-2 text-xl font-bold leading-tight md:text-2xl">
                {post.title}
              </h3>
              <p className="mt-2 text-base font-medium leading-relaxed">
                {post.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/blog"
          className="inline-block w-full rounded-xl px-8 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 sm:w-auto"
          style={{ background: CORAL, boxShadow: "0 10px 24px rgba(247,57,98,0.35)" }}
        >
          Read the blog
        </Link>
      </div>
    </section>
  );
}
