/**
 * Manufacturers asking for access.
 *
 * Public endpoint, so it is written defensively: anything on the open web
 * gets scripted eventually. Two caps, the same shape the demo already uses —
 * one per source, one global per day. The global one matters most, since it
 * holds even when someone rotates addresses.
 */
import { query } from "../db/client";

export type InterestKind = "waitlist" | "manufacturer";

export interface InterestInput {
  kind: InterestKind;
  email: string;
  company?: string;
  contactName?: string;
  partsMade?: string;
  problem?: string;
  sourceIp?: string;
}

const PER_IP_PER_DAY = 3;
const GLOBAL_PER_DAY = 200;

// Deliberately loose. Rejecting unusual but valid addresses would turn away
// the exact people this form exists to reach.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer`);
  }
  return trimmed;
}

export async function recordInterest(input: InterestInput): Promise<void> {
  const kind: InterestKind =
    input.kind === "waitlist" ? "waitlist" : "manufacturer";

  const email = required(input.email, "Email", 200);

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("That email address does not look valid");
  }

  // A waitlist signup is an email and nothing else. A manufacturer enquiry is
  // only worth keeping if it says who they are and what they make.
  const company =
    kind === "manufacturer" ? required(input.company, "Company", 160) : null;
  const contactName =
    kind === "manufacturer" ? required(input.contactName, "Name", 120) : null;
  const partsMade =
    kind === "manufacturer"
      ? required(input.partsMade, "Parts made", 400)
      : null;

  const problem =
    typeof input.problem === "string" ? input.problem.trim().slice(0, 2000) : null;

  const [global] = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM manufacturer_interest
      WHERE created_at > NOW() - INTERVAL '1 day'`
  );

  if (Number(global.count) >= GLOBAL_PER_DAY) {
    throw new Error("Too many submissions today. Please try again tomorrow.");
  }

  if (input.sourceIp) {
    const [perIp] = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM manufacturer_interest
        WHERE source_ip = $1 AND created_at > NOW() - INTERVAL '1 day'`,
      [input.sourceIp]
    );

    if (Number(perIp.count) >= PER_IP_PER_DAY) {
      throw new Error("You have already sent this. We will be in touch.");
    }
  }

  try {
    await query(
      `INSERT INTO manufacturer_interest
         (kind, company, contact_name, email, parts_made, problem, source_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        kind,
        company,
        contactName,
        email,
        partsMade,
        problem,
        input.sourceIp ?? null,
      ]
    );
  } catch (err) {
    // Already on the list. Saying so plainly beats an error that reads like
    // the form is broken.
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "23505") {
        throw new Error("That address is already on the list.");
      }
    }
    throw new Error("Could not record that");
  }
}

export interface InterestEntry {
  id: string;
  kind: InterestKind;
  company: string;
  contact_name: string;
  email: string;
  parts_made: string;
  problem: string | null;
  created_at: Date;
}

/** Panel only. These are other people's contact details. */
export async function listInterest(): Promise<InterestEntry[]> {
  return query<InterestEntry>(
    `SELECT id, kind, company, contact_name, email, parts_made, problem, created_at
       FROM manufacturer_interest
      ORDER BY created_at DESC
      LIMIT 500`
  );
}
