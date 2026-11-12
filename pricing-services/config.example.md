# Business config (example, optional)

Without this file the skill puts its quote, client message and price sheet in the
reply. With it, they go into a draft file in your business folder instead.

Copy this file to `~/.claude/skill-config/business.md` and fill it in. That copy
stays on your machine and is never committed. The `invoice` skill reads the same
file, so if you already set it up there, you are done.

- business_folder: D:\path\to\your\business\folder

The folder is expected to hold `_drafts/` (with a `README.md` describing the draft
layout) and `GIG-TRACKER.xlsx`.
