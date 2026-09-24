/**
 * Creates the Bubblegum tree that holds every Veymark part passport.
 *
 * Depth 14 holds 16,384 parts. Tree parameters are immutable after creation,
 * so this is sized for the pilot, not for production volume.
 *
 * Run once. Save the printed address into .env as MERKLE_TREE_ADDRESS.
 */
import "dotenv/config";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import { createTreeV2, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { readFileSync } from "fs";
import { homedir } from "os";

const RPC_URL = process.env.SOLANA_RPC_URL;
if (!RPC_URL) {
  throw new Error("SOLANA_RPC_URL is not set. Check your .env file.");
}

const walletPath =
  process.env.WALLET_PATH ?? `${homedir()}/.config/solana/id.json`;

async function main() {
  const umi = createUmi(RPC_URL!).use(mplBubblegum());

  const secret = new Uint8Array(JSON.parse(readFileSync(walletPath, "utf-8")));
  const keypair = umi.eddsa.createKeypairFromSecretKey(secret);
  umi.use(keypairIdentity(keypair));

  console.log("Payer:", keypair.publicKey.toString());

  const merkleTree = generateSigner(umi);

  console.log("Creating tree (depth 14, buffer 64)...");
  const builder = await createTreeV2(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });

  await builder.sendAndConfirm(umi);

  console.log("\n--- Tree created ---");
  console.log("TREE_ADDRESS=" + merkleTree.publicKey.toString());
  console.log(
    "Explorer: https://explorer.solana.com/address/" +
      merkleTree.publicKey.toString() +
      "?cluster=devnet"
  );
  console.log("\nCopy this into .env as MERKLE_TREE_ADDRESS or DEMO_MERKLE_TREE_ADDRESS.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
