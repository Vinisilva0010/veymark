/**
 * Turnstile verification.
 *
 * The widget on the page proves nothing on its own — a script can post
 * straight to the endpoint and never load it. What protects the form is this
 * call: the server asks Cloudflare whether the token it received is real,
 * unused, and issued for this site.
 *
 * Fails closed. If the check cannot be made, the submission is refused rather
 * than let through, since an open form is the thing this exists to prevent.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string
): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Not configured: local development and tests run without it rather than
  // being blocked by a service they do not need.
  if (!secret) return;

  if (typeof token !== "string" || !token) {
    throw new Error("Please complete the verification below.");
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  let outcome: { success?: boolean };

  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body });
    outcome = await response.json();
  } catch {
    throw new Error("Could not verify that right now. Please try again.");
  }

  if (!outcome.success) {
    throw new Error("Verification failed. Please try again.");
  }
}
