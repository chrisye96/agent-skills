# Business config (example)

Copy this file to `~/.claude/skill-config/business.md` and fill it in. That copy
stays on your machine and is never committed. The `invoice` and
`pricing-services` skills both read it.

- business_folder: D:\path\to\your\Photography

The folder is expected to hold:

| File | What it is |
|---|---|
| `PRICE-BOOK.md` | prices, payment and delivery rules, numbering scheme, licensing |
| `INVOICE-LEDGER.md` | every issued invoice, next numbers per prefix, retainer balances |
| `CLIENTS.md` | client contact facts |
| `GIG-TRACKER.xlsx` | per-gig hours and rates (`Gigs` sheet) |
| `Invoice-Template.md` | all client-facing wording: sender details, Notes, Terms, emails, signature |
| `_drafts/` | one draft file per send, with a `README.md` describing the layout |
