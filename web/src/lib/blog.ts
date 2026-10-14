/**
 * Blog posts, read from markdown files at build time.
 *
 * Posts live in web/content/blog as .md files: write one, commit it, and it
 * is online. No database, no panel, and every post is a static page a search
 * engine or an AI crawler can read without running JavaScript.
 *
 * The frontmatter carries more than a title because a post in 2026 is judged
 * on structure: a summary that can be quoted, a table of contents, questions
 * with self-contained answers, named sources, and links to related posts.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const DIR = path.join(process.cwd(), "content", "blog");

export interface Heading {
  id: string;
  text: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  /** One sentence, used on the card and as the meta description. */
  description: string;
  /** The answer up front, before the article starts. Quotable on its own. */
  summary: string;
  date: string;
  updated?: string;
  cover: string;
  coverAlt: string;
  readingMinutes: number;
  faq: { question: string; answer: string }[];
  sources: { label: string; url: string }[];
  /** Slugs of other posts, for the internal links at the end. */
  related: string[];
}

export interface Post extends PostMeta {
  html: string;
  headings: Heading[];
}

/** "Why a QR code is not proof" -> "why-a-qr-code-is-not-proof" */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readMeta(file: string, body: string, data: Record<string, unknown>): PostMeta {
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    slug: file.replace(/\.md$/, ""),
    title: (data.title as string) ?? file,
    description: (data.description as string) ?? "",
    summary: (data.summary as string) ?? "",
    date: (data.date as string) ?? "",
    updated: data.updated as string | undefined,
    cover: (data.cover as string) ?? "",
    coverAlt: (data.coverAlt as string) ?? "",
    readingMinutes: Math.max(1, Math.round(words / 200)),
    faq: (data.faq as PostMeta["faq"]) ?? [],
    sources: (data.sources as PostMeta["sources"]) ?? [],
    related: (data.related as string[]) ?? [],
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(DIR)) return [];

  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(DIR, f), "utf-8");
      const { data, content } = matter(raw);
      return readMeta(f, content, data);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<Post | null> {
  const file = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);

  // Section headings become the table of contents, and each one gets an id so
  // the contents can link straight to it.
  const headings: Heading[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) headings.push({ id: slugify(m[1]), text: m[1].trim() });
  }

  const processed = await remark().use(html).process(content);

  // remark does not add ids, so the anchors are injected afterwards against
  // the same slugs the contents list uses.
  let body = processed.toString();
  for (const h of headings) {
    body = body.replace(
      `<h2>${h.text}</h2>`,
      `<h2 id="${h.id}">${h.text}</h2>`
    );
  }

  return { ...readMeta(`${slug}.md`, content, data), html: body, headings };
}

export function getRelated(post: PostMeta): PostMeta[] {
  const all = getAllPosts();

  // Named ones first; if the post names none, fall back to the most recent
  // other posts so every article still carries internal links.
  const named = post.related
    .map((s) => all.find((p) => p.slug === s))
    .filter((p): p is PostMeta => Boolean(p));

  if (named.length >= 2) return named.slice(0, 3);

  const rest = all.filter(
    (p) => p.slug !== post.slug && !named.some((n) => n.slug === p.slug)
  );

  return [...named, ...rest].slice(0, 3);
}
