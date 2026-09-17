import { NextRequest } from "next/server";
import { verifyTap } from "@backend/services/verify";
import { readPassport } from "@backend/services/onchain";

/**
 * The endpoint a tag opens in the browser.
 *
 * Public by design: no auth, no session, no wallet. The tap itself is the
 * credential — only a genuine chip can produce a payload that validates.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const piccData = params.get("picc_data");
  const cmac = params.get("cmac");

  if (!piccData || !cmac) {
    return Response.json(
      { result: "unverified", reason: "Missing tap parameters" },
      { status: 400 }
    );
  }

  try {
    const outcome = await verifyTap({
      piccData,
      cmac,
      geo: {
        // Vercel and most CDNs expose approximate geo headers. Country and
        // region only — enough to spot the same part appearing in two distant
        // places, without storing a consumer's precise location.
        country: request.headers.get("x-vercel-ip-country") ?? undefined,
        region: request.headers.get("x-vercel-ip-country-region") ?? undefined,
      },
      readChain: readPassport,
    });

    return Response.json(outcome);
  } catch (err) {
    console.error("Verification failed:", err);
    // Never surface internal errors here: this response is read by consumers,
    // and an unverified result must look the same whether the cause was a
    // forged tag or a broken query.
    return Response.json(
      { result: "unverified", chainStatus: null, part: null },
      { status: 200 }
    );
  }
}
