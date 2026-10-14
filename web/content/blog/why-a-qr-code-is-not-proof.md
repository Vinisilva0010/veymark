---
title: "Why a QR code is not proof of anything"
description: "Every authenticity label in common use is visual, and anything visible can be photographed and reprinted. Here is what that costs the manufacturer."
summary: "A QR code, a serial number and a hologram are all pictures. Copying a picture costs a camera and a printer, which is why counterfeit parts pass the same check genuine ones do. When the fake fails, the manufacturer covers the warranty on a part they never made."
date: "2026-10-14"
cover: "/images/blog/qr-code-is-not-proof.png"
coverAlt: "A QR code label on a part and the same label coming out of a printer"
faq:
  - question: "Can a QR code be made secure?"
    answer: "Not against copying. A QR code is a picture of data, and reading it does not prove the label is the original — only that the data is the same. Any attacker with a camera can reproduce the identical code on a counterfeit part, and every scan of the copy returns the same result as the genuine one."
  - question: "Who pays when a counterfeit part fails?"
    answer: "The manufacturer whose name is printed on it. The car owner opens a warranty claim against the brand, the manufacturer cannot prove the part did not come from their factory, and they cover the repair. Warranty already costs a carmaker between 2.5% and 3.5% of revenue before counting parts that are not theirs."
  - question: "How is a cryptographic chip different from a QR code?"
    answer: "The chip holds a secret that never appears on any screen. It does not show the secret; it uses the secret to answer, and every tap produces a code it has never produced before. There is nothing visible to photograph, and a captured answer replayed later is rejected."
  - question: "Does a chip make counterfeiting impossible?"
    answer: "No. Someone can build a parallel operation with their own chips, their own site and their own distribution. What the chip removes is the cheap attack — photograph the label, reprint it — which is how counterfeit parts pass today. What is left is expensive, traceable and prosecutable."
sources:
  - label: "OECD and EUIPO, Global Trade in Fakes"
    url: "https://www.oecd.org/en/publications/global-trade-in-fakes_74c81154-en.html"
related: []
---

A counterfeit brake pad passes the same test a genuine one does. Both carry a label, and the label is a QR code, a serial number or a hologram. All three are things you look at, and anything you can look at, you can photograph and print again.

That is not a flaw in any particular label. It is what a visual mark is: a picture that says "trust me". Copying a picture costs a camera and a printer.

## Who pays when the copy fails

The manufacturer whose name is on the counterfeit. When the fake part breaks, the car owner opens a warranty claim against the brand printed on it. The manufacturer inspects the part, cannot prove it did not come from their factory, and covers the repair on something they never made.

Warranty already costs a carmaker between 2.5% and 3.5% of revenue, before counting parts that are not theirs.

Counterfeit goods account for USD 467 billion of world trade. In car parts in the European Union alone, EUR 4.3 billion a year.

## What a chip does that a label cannot

A cryptographic chip holds a secret that never appears on any screen. It does not show the secret; it uses the secret to answer. Every time a phone is held near the part, the chip produces a code it has never produced before, so a captured answer replayed later is rejected.

There is nothing to photograph, because nothing visible carries the proof.

## What this does not solve

It does not make counterfeiting impossible, and no system in any industry does. Someone can build a parallel operation: their own chips, their own site, their own distribution. What the chip removes is the cheap attack, which is how counterfeit parts are authenticated today. What is left is expensive, traceable and prosecutable.
