---
title: "A tag on a battery proves the box, not what is inside it"
description: "A sealed part can be opened, have its internals swapped, and closed again with the original tag still reading as authentic. Here is what closes that gap."
summary: "Authentication on a sealed part proves the case and nothing else. A workshop can open a battery, replace the cells with cheaper ones, close it, and the tag on the outside still answers correctly. Two things fix it: the tag goes across the opening so that opening it tears the antenna, and the components inside are recorded with tags of their own."
date: "2026-10-14"
cover: "/images/blog/tag-on-a-battery.png"
coverAlt: "A battery case with a tag across its opening, and the cells inside"
faq:
  - question: "Why does a tag on the outside of a part not prove what is inside it?"
    answer: "Because it only proves the case. A tag answers for the object it is attached to, and on a sealed part that object is the housing. Nothing about the housing says which cells, boards or bearings are inside it, so a part with the original shell and replacement internals verifies exactly the same as an untouched one."
  - question: "What does applying a tag across the opening do?"
    answer: "It makes opening the part destroy the tag. The antenna runs through the adhesive, so lifting the case tears it and the chip stops answering. A part that was opened goes silent rather than verifying, which turns tampering into something the next person can see."
  - question: "What if the tag position is recorded wrong?"
    answer: "Then the verification screen tells the buyer the wrong thing. If a part was sealed across the opening but recorded as a surface tag, a torn antenna proves nothing, because a surface tag is expected to tear. For that reason the position is recorded explicitly and an unrecognised value is refused rather than assumed."
  - question: "How are the components inside recorded?"
    answer: "Each one carries its own tag and is attached to the case in the system, in a named role. The product declares which product fills each role, so attaching the wrong part is refused rather than recorded. The verification screen then shows what should be inside and what is actually there."
  - question: "Does this stop someone from replacing the whole part?"
    answer: "No. Replacing the entire assembly with a counterfeit is a different attack, and that is what the chip itself answers: the counterfeit has no tag that can produce a valid response. The contents layer answers a narrower question — whether a genuine case still holds what it left the factory with."
sources:
  - label: "NXP, AN12196 — NTAG 424 DNA features and hints"
    url: "https://www.nxp.com/docs/en/application-note/AN12196.pdf"
related: ["why-a-qr-code-is-not-proof"]
---

A battery, an alternator and a control module have something in common: they are cases with parts inside them. Authentication works on the case, because that is where the tag goes. The case is what gets proved.

That leaves a gap wide enough to drive a business through. Open the case, replace the cells with cheaper ones, close it again. The housing is genuine. The tag is genuine. Every check returns the same answer it did before, and the buyer learns nothing.

This was not a problem we found in a specification. It was raised by people who work in the industry when they were shown the system, which is the reason the contents layer exists at all.

## Why does the tag only prove the case?

A tag answers for the object it is attached to. That is all it can do.

The chip holds a secret and uses it to prove it is the chip that was registered to a particular part. It has no way to know what is bolted inside the housing it sits on, because it has no connection to the contents. A battery with its original shell and replacement internals is, to the tag, the same battery.

## How do you make opening a part visible?

By applying the tag across the opening, so that opening the part destroys it.

The antenna runs through the adhesive. Lifting the case tears the antenna, and a torn antenna cannot answer. The part does not report tampering — it goes silent, which is a different and more useful thing. Silence is not an accusation, it is an absence, and the next person in the chain can see it.

This is not new. Tamper-evident seals have existed for decades and anyone can print a sticker that tears. What was always missing is what happens after it tears: you are left looking at a broken sticker with no way to know whether the part underneath is genuine, or whether someone replaced the whole thing and applied a fresh sticker. The chip answers that second question.

## Why does the recorded position matter?

Because a verification screen that reports the wrong thing is worse than one that reports nothing.

If a part was sealed across the opening but the system recorded it as a surface tag, then a torn antenna means nothing: surface tags are expected to tear with handling. The buyer sees a silent part and no explanation. If it was recorded correctly, a silent part means the case was opened.

For that reason the operator states where the tag goes, and a value the system does not recognise is refused rather than assumed. Guessing "surface" when the operator sealed the opening is the kind of silent default that makes a system lie.

## How are the contents recorded?

The manufacturer declares, once, what belongs inside a product: a role named "cell", filled by a specific product from their own catalogue.

On the line, the operator reads the case tag, then reads each component tag into its role. Anything that is not the declared product for that role is refused. Without that, the role label is decorative — a controller could be recorded as the cell and the system would agree.

The record is then written per unit, and the verification screen shows what should be inside the case and what is in it.

## What this does not solve

It does not stop someone replacing the entire part with a counterfeit. That is a different attack, and it is the one the chip itself answers: a counterfeit has no tag that can produce a valid response.

The contents layer answers a narrower question. Given a genuine case, does it still hold what it left the factory with.
