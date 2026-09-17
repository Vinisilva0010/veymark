import { currentUser } from "@/lib/session";
import { getManufacturer } from "@backend/services/catalog";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const manufacturer = await getManufacturer(user.manufacturerId);

  return Response.json({
    user: { email: user.email, displayName: user.displayName },
    manufacturer: manufacturer
      ? {
          name: manufacturer.name,
          walletPubkey: manufacturer.wallet_pubkey,
          verifiedOnchain: manufacturer.verified_onchain,
        }
      : null,
  });
}
