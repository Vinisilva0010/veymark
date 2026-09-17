/**
 * On-chain passport reads via the DAS API.
 *
 * Compressed NFTs do not live in regular accounts, so a standard RPC cannot
 * read them — an indexer supporting the Digital Asset Standard is required.
 *
 * This is deliberately read-only and failure-tolerant: a lookup that cannot
 * complete reports "unavailable" rather than throwing, because the chain layer
 * is audit evidence, not the anti-cloning defence. The chip decides
 * authenticity; this confirms the public record exists and matches.
 */
import type { ChainStatus } from "./verify";

const TIMEOUT_MS = 4000;

interface DasAsset {
  id: string;
  ownership?: { owner?: string };
  compression?: { compressed?: boolean; tree?: string };
  burnt?: boolean;
}

export async function readPassport(
  assetId: string,
  expectedOwner: string
): Promise<ChainStatus> {
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) return "unavailable";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "veymark-verify",
        method: "getAsset",
        params: { id: assetId },
      }),
      signal: controller.signal,
    });

    if (!response.ok) return "unavailable";

    const payload = (await response.json()) as {
      result?: DasAsset;
      error?: unknown;
    };

    if (payload.error || !payload.result) return "unavailable";

    const asset = payload.result;

    // A burnt passport is a definite mismatch, not an unavailable read.
    if (asset.burnt) return "mismatch";

    // The passport must still be held by the manufacturer that issued it.
    // A transfer is legitimate on resale, but that flow lands in phase 6 and
    // will pass the current owner in instead of the issuer.
    if (asset.ownership?.owner && asset.ownership.owner !== expectedOwner) {
      return "mismatch";
    }

    if (asset.compression?.compressed !== true) return "mismatch";

    return "confirmed";
  } catch {
    // Network error, timeout, malformed response: unavailable, never a
    // failed verification.
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}
