# Veymark

Physical proof that can't be copied. A cryptographic chip on each part, plus a
digital passport minted per unit on Solana.

## The problem

Every anti-counterfeit measure in common use today — QR codes, serial numbers,
holograms — is defeated with a camera and a printer. Photograph the label,
reprint it, apply it to the counterfeit. The verification passes because the
code is identical.

Counterfeit goods account for USD 467 billion of world trade. In auto parts
alone, Europe loses over EUR 4 billion a year, and the most counterfeited items
are bulbs, bearings and shock absorbers — safety components, where a failure
costs more than a margin.

## What this is not

We do not claim this is impossible to fake, and we never will. Any verification
screen can be cloned, including ours. What Veymark removes is the easy attack.
What remains is building a parallel fake ecosystem — own tags, own site, own
distribution — which is expensive, traceable and prosecutable.

## How it works

Three independent proofs, each failing independently:

1. **Proof of silicon.** A genuine NXP chip carries a factory signature the
   phone verifies locally, with no server involved. A clone fails here first.
2. **Proof of touch.** The NTAG 424 DNA emits a SUN (Secure Unique NFC) message
   on every tap: UID and a read counter encrypted with AES-128, signed with a
   truncated CMAC. Every tap produces a payload the chip has never produced
   before, and a captured payload replayed later is rejected by the counter.
3. **Proof in the open.** Each part is minted as a compressed NFT on Solana.
   Anyone can read that record in a block explorer and check it against the
   manufacturer's public wallet, without trusting our infrastructure at all.

Verification requires no app, no wallet and no account: the tag opens a URL in
the browser and the answer appears.

## Simulated tags — read this

**Physical tags are not part of the current build.** The SUN layer is exercised
by a simulator in `backend/src/crypto/sun.ts`, which generates the same
payloads a real tag emits: same AES-128, same PICCData layout, same
incrementing counter.

This is not a mock response. The backend performs real cryptographic
validation, real CMAC verification and real replay rejection — the simulator
only replaces the hardware that would emit the payload.

The limit worth stating plainly: the implementation follows NXP application
note AN12196, but has not been validated against physical silicon. The test
suite proves generation and verification agree with each other and that wrong
keys, forged signatures and tampered payloads are rejected. It does not prove
the byte layout matches a real chip. When hardware enters the project, only the
generation side is replaced.

## Verification states

Three states, and the second is a deliberate product decision:

- **Authentic** — cryptography validated. On-chain status is reported alongside
  it, and when the public record cannot be read the screen says so rather than
  hiding it.
- **Could not verify** — never "counterfeit". A damaged tag and a fake tag are
  indistinguishable to software, and accusing a legitimate buyer is a worse
  failure than admitting uncertainty.
- **Unusual pattern** — cryptography passed but behaviour did not: a replayed
  counter, or the same part appearing in distant places minutes apart.

## Stack

| Layer | Choice |
|---|---|
| On-chain program | Anchor / Rust |
| Passports | Metaplex Bubblegum (compressed NFTs) |
| Chain reads | Helius DAS API |
| Backend | Node.js, TypeScript, PostgreSQL |
| Frontend | Next.js |
| Tag cryptography | AES-128-CBC + AES-CMAC (`@noble/ciphers`) |

Compressed NFTs are the reason this runs on Solana specifically: a passport per
individual unit is only economically viable where minting costs close to
nothing. On most networks the issuance cost alone restricts this to luxury
goods.

## Devnet deployment

| Item | Address |
|---|---|
| Program | `9tCeoRVp4MRZTM6hxtJp2Nd797i1Mf2JbwLgXE6JFZcp` |
| Merkle tree | `3uvL6ntvFq1iqBoNnEjPymcD6TQP1suTqjQFy7sam9hk` |
| First passport | `E3FMgTHkTQQCPpswhxZ712o7Sr5T6H1g41ypvJvTrK8d` |

Note: Solscan does not index compressed NFTs on devnet. Use the DAS API or an
explorer with DAS support to inspect passports.

## Layout

## Running locally

Requires PostgreSQL, Node 22 and a Solana devnet keypair.

```bash
pnpm install
cp .env.example .env          # fill in SOLANA_RPC_URL, DATABASE_URL, SDM_MASTER_KEY
psql "$DATABASE_URL" -f backend/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f backend/migrations/002_auth.sql
npx ts-node scripts/seed-catalog.ts
cd web && npm run dev
```

`SDM_MASTER_KEY` must be 32 random bytes as 64 hex characters
(`openssl rand -hex 32`). Tag keys are encrypted at rest with it, so a database
dump alone cannot forge taps.

## Tests

```bash
npx ts-node backend/tests/sun.test.ts       # SUN cryptography, 14 assertions
npx ts-node backend/tests/crypto.test.ts    # key encryption roundtrip and tamper rejection
anchor test --skip-deploy                   # on-chain program, 11 assertions
```

## Status

Nothing has shipped. Everything runs on devnet, tags are simulated, and the
landing page says so.
