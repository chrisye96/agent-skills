---
name: invoice
description: Use when the user asks to create, draft, revise, or number an invoice for a photography gig, or to write the email that sends it. Triggers include /invoice, 开发票, 开票, 写发票, 发票邮件, 催款, "invoice for", "invoice email", "bill the client", or after-shoot billing talk.
---

# Photography Invoice

Draft Zoho-ready invoices from the price book, assign the next invoice number, and log the gig in the tracker. Invoice text is in English; talk to the user in whatever language they used.

## Setup

Read `~/.claude/skill-config/business.md` first. Its `business_folder` line is the folder written as `<folder>` below. If that file is missing, stop and tell the user to copy `config.example.md` from this skill's folder to that path and fill it in. Never guess a folder.

## Sources

Read these before drafting anything:

- `<folder>\PRICE-BOOK.md`: prices, payment and delivery discipline (deposit threshold, same-day rule, invoicing deadline, late fee, e-transfer details), numbering rules, licensing algorithm
- `<folder>\INVOICE-LEDGER.md`: **the invoice source of truth.** Every issued invoice number, amount, client, hours, and the live retainer balances. Plain Markdown, so read it directly; never parse a PDF for something this file already answers.
- `<folder>\Invoice-Template.md`: **all client-facing wording.** Segment prefixes and what each covers, sender header, Notes, Terms and Usage Rights blocks per segment, email wording, signature. Its section "发票 skill 实发版" overrides earlier sections where they differ. Take every client-facing sentence from this file, never from memory.

`<folder>\CLIENTS.md` holds client contact facts (email, phone), how each client was met, and licence and portfolio status. Read it for Bill To and the email address before asking the user. It is a copy; Zoho's customer list is the origin for emails.

`<folder>\GIG-TRACKER.xlsx` (`Gigs` sheet) holds per-gig hour and $/hr analytics. Read it only when the user asks about time or rate economics. **On any conflict, the ledger wins.**

### Ledger-first rule

Any question about "what has already been invoiced" (next number, past amounts, retainer balance, whether an event was billed) is answered from `INVOICE-LEDGER.md` alone.

Fall back to globbing filenames and reading PDFs **only** when the ledger is missing, or when it is present but demonstrably does not cover the period in question (its "Last updated" date predates the invoice being asked about, or the month has a visible gap in the sequence). Say which fallback you used and why. After any fallback, write what you learned back into the ledger so the next run does not repeat it.

Reading PDFs is expensive and unreliable: some Zoho exports carry no extractable text layer at all and need page rendering to read. That is the cost the ledger exists to avoid.

## Iron rule: never invent a fact

Any price, date, name, photo count, hours figure, or payment method that the user did not state and the sources do not pin down is a QUESTION, not a guess. Collect every gap first, then ask ONCE with AskUserQuestion (batched; free-text gaps go in one follow-up message). Do not drip questions one at a time, and do not output a "draft with placeholders" as the final answer.

## Validation checklist: ask about any miss or conflict

| Field | Check |
|---|---|
| Client name (+ email if new) | needed for Bill To / Zoho send; look the client up in `CLIENTS.md` first and ask only if missing |
| Exact shoot date | "上周 / the other day" is not a date; ask which day |
| Shoot start and end time | clock times go in the tracker (`Shoot Time` column) and the ledger Notes; whether they also go on the invoice depends on the segment (see the templates file). Suggest the first and last frame timestamps in EXIF as the source when the user is unsure |
| Segment prefix | chosen by "which business the money comes from", not shoot content; the prefixes and their scope are in the templates file |
| Amount vs price book | deviation from menu with no stated reason → confirm (friend price? reduced scope? extras?); client-facing wording stays neutral, real reason goes in tracker Notes |
| Photo count + delivery deadline | both go in invoice Notes; deadline = the default delivery window in the templates file unless the user says otherwise |
| Hours: on-site / editing (estimate ok) / travel+admin | for the tracker row, not the invoice |
| Payment | method + date; apply the price book's deposit and same-day thresholds; cash needs the paid line ON the invoice (only record that exists) |
| Licence | commercial use mentioned but no licence line → flag it (price book licensing section); licence is always its own line item |
| Tax | use the templates file's tax line; never add a tax charge it does not list |
| Client email | needed to send; ask for it whenever the client is new |
| Payment state → email variant | paid = receipt email; unpaid = payment-request email. Payment instructions come from the templates file; the price book's payment section is their source of truth |
| Gallery status | link ready → include it; not ready → "by {date}" line; when unpaid, always add that full-resolution downloads unlock on payment (that is the leverage, see the price book's payment section) |

## Invoice number

`PREFIX-YYYYMM-NNN`, month = invoice month, NNN = three-digit sequence per prefix per month. Sequences are per prefix, so a `PT-202608-001` does not consume the `EV-202608-001` slot.

Next number = **`INVOICE-LEDGER.md` section 3 ("Next invoice numbers"), max for that prefix + 1.** That section is maintained on every issue and is the answer.

Only if the ledger is missing or does not cover the month, fall back to Glob `**/*<PREFIX>-<YYYYMM>*` over `<folder>` (any extension; historical numbers exist only as `Invoice *.pdf`, `Invoice Invoice #*.pdf`, or bare `*.pdf`), then update the ledger with what you found.

A `-A`/`-B` suffix or a separate deposit invoice consumes its own file but shares the base sequence. Never renumber an issued invoice; a new prefix applies to future invoices only.

## Output: one Zoho-ready block

**Where it goes: a file, never the chat window.** Write the invoice and its email into `<folder>\_drafts\<slug>.md`, following the conventions in `_drafts\README.md` (status table at the top, internal reasoning separated from client-facing text, pre-send checklist at the bottom, one file per send). In chat, print only the file path and one line saying what changed. Paste the full block into chat only if the user explicitly asks to see it there.

After the user confirms the invoice was sent, delete the draft file as the third step, alongside updating the ledger and the tracker.

Build the block from the templates file: header (invoice number, date, sender, Bill to), line-items table (session / extras / licence as separate rows), `Total: $X CAD`, then the Notes and Terms for the segment and payment state. Blocks the templates file marks as verbatim are copied verbatim.

## Email draft (always produced together with the invoice)

One English email, ready to paste into Zoho/Gmail. Subject line, payment wording and sign-off come from the templates file. Shape, in order:

1. **Subject** in the templates file's format, including the invoice number
2. Greeting with first name, then ONE personal thank-you line about the shoot (specific, not boilerplate)
3. One or two sentences: invoice below/attached, total `$X CAD`, what it covers in a phrase; do not restate the whole line-items table
4. **Payment paragraph, one of two variants:**
   - *Unpaid:* due wording for this client type + the payment instructions + any deposit/balance split already agreed
   - *Paid:* payment received in full on {date} via {method}; this invoice is for your records
5. **Delivery line:** gallery link if ready, else the "ready by {date}" line; unpaid emails add the downloads-unlock-on-payment sentence
6. Sign-off from the templates file

Tone: warm, brief, zero apology padding even if the invoice is late against the price book's invoicing deadline. Overdue chasers stay polite and factual: restate amount, payment instructions, and the unlock rule, nothing else.

## Check mode: pre-send verification of a generated invoice

Trigger: the user gives an invoice number and asks to check/verify it (检查, 核对, "check PT-202607-001"), typically after exporting the PDF from Zoho and before sending. This guards the manual paste-into-Zoho step, where transcription errors live.

1. Locate the file: Glob `**/*<number>*` under `<folder>` (naming drifts: `Invoice <n>.pdf`, `<n>.pdf`, `Invoice Invoice #<n>.pdf`). No match → say so, list that month's files, and ask the user to point to or send the file; never "check" a file you did not find, and never skip the check because the file is missing.

   Check mode is the one place the PDF **must** be opened: the whole point is catching transcription errors introduced by the manual paste into Zoho, and only the exported PDF shows those. The ledger is what you check the PDF *against*, never a substitute for reading it. If `pdftotext` returns nothing, the export has no text layer: render the page (PyMuPDF `get_pixmap(dpi=150)` to PNG) and read the image rather than reporting the file as unreadable.
2. Read the PDF and verify every line against the sources, not from memory:
   - number on the document = number in the filename = expected next number at issue time
   - client name, shoot/invoice dates plausible (folder prefix `YYMMDD_` should match the shoot date)
   - line items sum to the stated total; amounts match the agreed draft / price book menu, deviations have a stated reason
   - the templates file's tax line present (never a tax charge); licence, if sold, is its own line with scope wording
   - Notes and Terms match the segment's blocks in the templates file; delivery deadline present
   - cross-check the ledger row: number, client, date, amount, hours agree; for a retainer draw, the running balance still adds up
3. Report PASS or a numbered discrepancy list. Never edit the PDF and never call it sendable with open discrepancies; fixes happen in Zoho and get re-exported.

## After the user confirms the draft

**1. Update `INVOICE-LEDGER.md` (required).** Add the row to the invoice index, bump section 3 "Next invoice numbers", refresh the "Last updated" date, and, if the gig was a retainer draw, update that retainer's draw table and balances. If the gig had been sitting under "Unbilled work", delete it from there in the same edit; leaving it in both places is how the ledger starts lying.

**2. Append one row to `GIG-TRACKER.xlsx` `Gigs` sheet** with openpyxl (`py`, install openpyxl if missing): first empty row, write ONLY input columns A–I, L–N and O (`Shoot Time`, format `HH:MM-HH:MM`, 24h); J and K hold prefilled formulas, so never write or clear them. Mark estimated editing hours in Notes ("estimate, update after delivery"). `PermissionError` on save = file open in Excel; ask the user to close it and retry.

**3. Update `CLIENTS.md`.** New client: add a row with the email used in Zoho. Existing client: add the new invoice number to the Invoices cell and fix any changed contact detail. Refresh "Last updated".

Then remind the user: paste into Zoho and hit send; the price book's invoicing deadline runs from the shoot.
