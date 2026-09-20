/**
 * Mints one part passport as a compressed NFT.
 *
 * Standalone script for now — this logic moves into the provisioning
 * endpoint in phase 4, where the mint authority stays server-side.
 */
import "dotenv/config";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey, none } from "@metaplex-foundation/umi";
import {
  mintV2,
  mplBubblegum,
  parseLeafFromMintV2Transaction,
} from "@metaplex-foundation/mpl-bubblegum";
import { readFileSync } from "fs";
import { homedir } from "os";

const RPC_URL = process.env.SOLANA_RPC_URL;
const TREE = process.env.MERKLE_TREE_ADDRESS;

if (!RPC_URL) throw new Error("SOLANA_RPC_URL is not set");
if (!TREE) throw new Error("MERKLE_TREE_ADDRESS is not set");

const walletPath =
  process.env.WALLET_PATH ?? `${homedir()}/.config/solana/id.json`;

async function main() {
  const umi = createUmi(RPC_URL!).use(mplBubblegum());

  const secret = new Uint8Array(JSON.parse(readFileSync(walletPath, "utf-8")));
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(secret)));

  const merkleTree = publicKey(TREE!);

  console.log("Minting passport into tree", TREE);

  const { signature } = await mintV2(umi, {
    leafOwner: umi.identity.publicKey,
    merkleTree,
    metadata: {
      name: "Shock Absorber XR-40",
      uri: "https://veymark.xyz/metadata/demo-part-001.json",
      sellerFeeBasisPoints: 0,
      collection: none(),
      creators: [],
    },
  }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

  // Devnet RPCs often confirm before the transaction is queryable, so retry
  // the parse instead of failing on the first miss.
  let leaf;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      leaf = await parseLeafFromMintV2Transaction(umi, signature);
      break;
    } catch (err) {
      if (attempt === 10) throw err;
      console.log(`Transaction not indexed yet, retrying (${attempt}/10)...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  if (!leaf) throw new Error("Could not parse leaf after 10 attempts");

  console.log("\n--- Passport minted ---");
  console.log("Asset ID:", leaf.id.toString());
  console.log(
    "Solscan: https://solscan.io/token/" + leaf.id.toString() + "?cluster=devnet"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
