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

## Sealed parts

A tag on a battery proves the case. It says nothing about the cells inside, so
a workshop can open the case, swap the internals and close it again with the
tag still reading as authentic.

Two things answer that. The tag is applied across the opening, so opening the
case tears the antenna and the part stops answering. The position is recorded,
because a part sealed across the opening but recorded as a surface tag would
tell the buyer a torn antenna proves nothing — an unrecognised position is
refused rather than assumed.

The components inside carry their own tags, recorded as belonging to that case.
A product declares what belongs inside it and which product fills each slot, so
attaching the wrong part is refused rather than recorded. A slot cannot be
removed once real parts are recorded in it: that would erase the record of what
is inside cases already shipped.

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

```
programs/veymark/      Anchor program (manufacturer registry)
backend/
  migrations/          001 to 010
  src/crypto/          SUN generation and verification, key encryption
  src/services/        auth, catalog, verify, onchain, minting,
                       provisioning, assembly, interest
  tests/               sun, crypto, assembly, seal-position, catalog-assembly
web/
  src/app/             landing, /v, /demo, /dashboard, /api/*
  src/components/      landing and demo
scripts/               create-tree, mint-passport, seed-catalog,
                       seed-demo-parts, simulate-tap, provision-test-part
```

## Running locally

Requires PostgreSQL, Node 22 and a Solana devnet keypair.

```bash
pnpm install
cp .env.example .env          # fill in SOLANA_RPC_URL, DATABASE_URL, SDM_MASTER_KEY
for f in backend/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
npx ts-node scripts/seed-catalog.ts
cd web && npm run dev
```

On WSL, PostgreSQL does not start automatically (no systemd). Start it with:

```bash
sudo service postgresql start && pg_isready
```

`SDM_MASTER_KEY` must be 32 random bytes as 64 hex characters
(`openssl rand -hex 32`). Tag keys are encrypted at rest with it, so a database
dump alone cannot forge taps.

## Tests

61 tests, most of them rejection cases.

```bash
npx ts-node backend/tests/sun.test.ts              # SUN cryptography, 14
npx ts-node backend/tests/crypto.test.ts           # key encryption, tamper rejection
npx ts-node backend/tests/assembly.test.ts         # sealed assemblies, 17
npx ts-node backend/tests/seal-position.test.ts    # seal position validation, 7
npx ts-node backend/tests/catalog-assembly.test.ts # slot declarations, 12
anchor test --skip-deploy                          # on-chain program, 11
```

## Status

Nothing has shipped. Everything runs on devnet and tags are simulated. The tags
have been sourced and we know where to buy them; none have been ordered. The
landing page says all of this.