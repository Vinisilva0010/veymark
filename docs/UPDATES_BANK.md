# Veymark — Updates Bank

Raw material for Colosseum daily updates and weekly videos. Write here the moment something ships, even in rough form — polish happens at posting time, not at writing time.

**Posting rules**
- Never open with "excited to announce", "happy to share", "introducing"
- State what happened and what it means. No adjectives about how great it is
- One update = one concrete thing + why it was non-obvious
- English
- Link or screenshot whenever there's something to look at
- Mark "others can test" only when there is genuinely something to test

---

## BANKED — ready to post

### [ ] Public positioning / site live
Wrote the public positioning today. Hardest part wasn't the copy, it was deciding what not to claim: we explicitly refuse to say this is impossible to fake, because any verification screen can be cloned visually. What we remove is the easy attack — photograph and reprint. veymark.xyz

### [ ] Why we won't promise "unfakeable"
Every anti-counterfeit product on the market promises the impossible. We put the opposite on our own landing page: any screen can be cloned, including ours. The defensible claim is narrower and true — we kill the photograph-and-reprint attack and force a counterfeiter into building a full parallel ecosystem, which is expensive, traceable and prosecutable.

### [ ] Three independent proofs
Most "blockchain anti-counterfeit" projects have one proof. We have three, and they fail independently: factory silicon signature checked on the phone with no server involved; a per-tap code the chip has never produced before; and the record itself readable in a public block explorer without trusting our site at all.

---

## TO WRITE AS IT HAPPENS

Template:
```
### [ ] <what shipped>
<what it does in one line>
<the non-obvious part, or what broke and why>
<link / screenshot / tx>
```

### Phase 1 — On-chain foundation
- [ ] Manufacturer registry program deployed to devnet — program ID, link to explorer
- [ ] Merkle tree created — depth, capacity, why compressed NFTs are the only viable option here
- [ ] First cNFT minted — Solscan link

### Phase 2 — Database and catalog
- [ ] Schema decisions — why SDM keys are encrypted at rest
- [ ] Catalog panel working

### Phase 3 — Chip simulator (the interesting one)
- [ ] Simulator generating real SUN URLs — same AES-128, same PICCData format, same counter. Not a mock: the backend validates real cryptography
- [ ] Replay attack blocked — show the same tap rejected on second use. This is the strongest demo material of the whole build
- [ ] Edge cases passing

### Phase 4 — Provisioning
- [ ] Tag provisioned → passport minted in one flow
- [ ] Mint authority locked server-side

### Phase 5 — Interfaces
- [ ] Three verification states live — MARK AS TESTABLE HERE, include link and instructions
- [ ] Judge demo page
- [ ] Manufacturer dashboard with suspicious-pattern alerts

### Phase 6 — Expansion
- [ ] Ownership transfer on resale
- [ ] Incentive token for suspicious-scan reports
- [ ] Verified used-parts marketplace

---

## WEEKLY VIDEO NOTES (1 min each, opens Sep 18)

Rule: show the thing running, not slides. Screen recording beats talking head.

- [ ] Week 1 — on-chain foundation + first mint on Solscan
- [ ] Week 2 — simulator generating a valid tap, backend rejecting a replay live
- [ ] Week 3 — three verification states, judge demo page
- [ ] Week 4 — expansion layer + founder segment (22 years at GM)