/**
 * Passport minting.
 *
 * The mint authority keypair lives only here, server-side, loaded from the
 * filesystem path in the environment. It is never exposed through an API and
 * never reaches the browser: whoever can mint can create passports for parts
 * that do not exist.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey, none } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  mintV2,
  mplBubblegum,
  parseLeafFromMintV2Transaction,
} from "@metaplex-foundation/mpl-bubblegum";

export interface PassportMetadata {
  model: string;
  batch: string;
  manufacturerName: string;
  chipUid: string;
}

let cachedUmi: ReturnType<typeof createUmi> | null = null;

function getUmi() {
  if (cachedUmi) return cachedUmi;

  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) throw new Error("SOLANA_RPC_URL is not set");

  // Serverless runtimes have no persistent filesystem, so the key comes from
  // the environment there. The file path is kept for local development.
  //
  // This is acceptable for devnet, where the key holds no value. On mainnet
  // the mint authority must live in a KMS or HSM: whoever holds it can mint
  // passports for parts that were never manufactured.
  const inlineKey = process.env.MINT_AUTHORITY_SECRET_KEY;
  const keypairPath = process.env.MINT_AUTHORITY_KEYPAIR_PATH;

  let secretJson: string;
  if (inlineKey) {
    secretJson = inlineKey;
  } else if (keypairPath) {
    secretJson = readFileSync(keypairPath, "utf-8");
  } else {
    throw new Error(
      "Set MINT_AUTHORITY_SECRET_KEY or MINT_AUTHORITY_KEYPAIR_PATH"
    );
  }

  const parsed = JSON.parse(secretJson);
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error("Mint authority key must be a 64-byte JSON array");
  }

  const umi = createUmi(rpcUrl).use(mplBubblegum());
  umi.use(
    keypairIdentity(
      umi.eddsa.createKeypairFromSecretKey(new Uint8Array(parsed))
    )
  );

  cachedUmi = umi;
  return umi;
}

/**
 * Mints one passport and returns its asset id.
 *
 * The parse step retries because devnet RPCs routinely confirm a transaction
 * before it is queryable, and failing there would mark a successful mint as
 * failed — leaving an orphan passport and a part that retries forever.
 */
export interface MintResult {
  assetId: string;
  /** Base58 transaction signature — the on-chain proof explorers can render. */
  signature: string;
}

export type TreeTarget = "production" | "demo";

export async function mintPassport(
  metadata: PassportMetadata,
  target: TreeTarget = "production"
): Promise<MintResult> {
  // Demo mints go to a separate tree. A Merkle tree has a fixed capacity that
  // cannot grow, so letting anonymous visitors mint into the production tree
  // would let them fill it and break real provisioning permanently.
  const treeAddress =
    target === "demo"
      ? process.env.DEMO_MERKLE_TREE_ADDRESS
      : process.env.MERKLE_TREE_ADDRESS;

  if (!treeAddress) {
    throw new Error(
      target === "demo"
        ? "DEMO_MERKLE_TREE_ADDRESS is not set"
        : "MERKLE_TREE_ADDRESS is not set"
    );
  }

  const umi = getUmi();
  const merkleTree = publicKey(treeAddress);

  const { signature } = await mintV2(umi, {
    leafOwner: umi.identity.publicKey,
    merkleTree,
    metadata: {
      name: metadata.model.slice(0, 32),
      uri: `${process.env.VERIFY_BASE_URL ?? "https://veymark.xyz"}/api/metadata/${metadata.chipUid}`,
      sellerFeeBasisPoints: 0,
      collection: none(),
      creators: [],
    },
  }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

  let lastError: unknown;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const leaf = await parseLeafFromMintV2Transaction(umi, signature);
      return {
        assetId: leaf.id.toString(),
        signature: base58.deserialize(signature)[0],
      };
    } catch (err) {
      lastError = err;
      if (attempt < 10) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  throw new Error(
    `Mint confirmed but asset id could not be read: ${String(lastError)}`
  );
}
