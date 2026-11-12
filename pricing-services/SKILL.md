---
name: pricing-services
description: Use when a freelancer or small service business asks what to charge, how to quote a job or client, whether their rates are too low, or how to raise prices without losing existing clients. Applies to photography, video, design, development, tutoring, and any service work. Also triggers on 报价, 定价, "what should I charge", "am I charging too little".
license: MIT
---

# Pricing Services

## Overview

Price from the person's own transaction data, not from vibes or generic market tables. Deliver a menu and a reusable price sheet, not a single number.

## Workflow

1. **Audit real transactions before anything else.** Ask for past gigs (or invoice files; offer to read a folder if one exists): date, client type, hours INCLUDING prep, travel, editing, admin, amount, deliverables. Compute realized $/hr per segment. People's beliefs about which work pays best are usually wrong; the data decides. This step regularly reverses conclusions, so never skip it for a returning-topic user and never quote from intuition alone.
2. **Find the true hourly floor.** Post-production and admin often exceed on-site hours. Compare blended $/hr against local minimum wage and the person's opportunity cost. Flag every segment below floor.
3. **Anchor to market, positioned honestly.** Search local rates for their experience tier. Established brands can hide prices; newcomers win with transparency (it filters price-shoppers and replaces a portfolio they don't have yet).
4. **Design a menu, not a number.** 2 to 3 tiers plus add-ons so an unknown budget self-selects; you never need to guess what the client can pay. Cap every deliverable explicitly (counts, hours, revision rounds). Individuals get package prices; organizations get hourly or day rates.
5. **Separate labor from usage rights.** Service fee ≠ licence. Personal and organic-social use included; commercial promo licence is a flat add-on, addable after delivery (defers the buying decision, creates a second touchpoint); paid advertising always quoted separately.
6. **Raise prices with an anchor mechanism.** Publish the standard price, sell at a visible launch or founding rate. Raising later = removing the discount, no re-justification needed. Existing clients get one explicit transition offer; losing the worst-paying client is a win, not a risk.
7. **Guardrails in every quote:** deposit (about 50%) above a threshold, watermarked previews shareable before payment with full-res unlocked on payment, invoice within 48h, deliver the promised count (over-delivery is unpaid work), overtime rate agreed before continuing.
8. **Check deliverability.** Only quote what they can produce at professional quality today. Skills they are still learning become "quoted case by case", not menu items.

## Intake (batch the questions, don't drip)

Past gigs and amounts; hidden hours per gig; opportunity cost; monthly capacity cap and income goal; this client's relationship, repeat potential, and budget signals; local competitors; what they can deliver at quality today.

## Client signals

| Signal | Read | Move |
|---|---|---|
| "I respect your rates, but it affects how much I can afford" | price-sensitive but cooperative | give the menu, let them trim scope; do not discount |
| Accepts instantly, zero pushback | underpriced | raise one step on the next quote |
| Ghosts after quote | missing proof, not wrong framing | attach portfolio link to every quote |
| Repeat org with a hard budget cap | rate can't rise | shrink scope to fit the price, or trade for reciprocity (credit, referrals, lead capture) |
| Prepays or signs retainer | cash-flow value | a below-list rate can be worth it; renegotiate at renewal only |

## Common mistakes

- Quoting one number instead of a menu
- Using generic market tables without auditing the person's own data
- Ignoring editing/admin hours when judging profitability
- Silently bundling extras (video, rush, usage rights) instead of pricing them
- Jumping 3x on a channel where the old price is known, with no founding-rate bridge
- Leaving the user with one quote instead of the start of a price sheet

## Output

End every engagement with three artifacts: (a) the quote menu for this job, (b) a ready-to-send client message in the client's language, (c) a reusable price sheet the next quote can start from.

**Where they go** depends on whether `~/.agents/skill-config/business.md` exists (format
in this skill's `config.example.md`; the `invoice` skill reads the same file).

- **It exists:** a file, never the chat window. Write all three into
  `<business_folder>/_drafts/QUOTE-<slug>.md`, following the conventions in
  `_drafts/README.md`: status table at the top, pricing reasoning under an "internal, do
  not send" heading, the client letter in its own copyable code block, open items at the
  bottom. In chat, print only the file path and one line saying what changed. Delete the
  draft once the job is booked or declined, recording the outcome in
  `<business_folder>/GIG-TRACKER.xlsx` either way.
- **It does not exist:** keep the three artifacts in the reply.
