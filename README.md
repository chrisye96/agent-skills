# agent-skills

Skills I wrote in the open [Agent Skills](https://agentskills.io) format, so they work in any agent that supports it: Claude Code, Codex, Gemini CLI, OpenCode, Cursor, GitHub Copilot and others. Each folder is one skill: a `SKILL.md` plus any scripts or assets it needs.

## Skills

| Skill | What it does | Needs |
|---|---|---|
| [demo-menu](demo-menu/) | Dev-only panel that switches between design variants on the real pages of a web app, so options can be compared in context before one is built | a React web app (porting notes for others) |
| [invoice](invoice/) | Drafts Zoho-ready photography invoices and their emails, assigns the next number from a ledger, logs the gig, and checks exported PDFs before sending | config + your own business folder, Python |
| [lr-label-exports](lr-label-exports/) | Traces exported JPEGs back to their Lightroom Classic catalog photos and colour-labels them, with an undo log | Lightroom Classic with the [Cull Remote](https://github.com/chrisye96/cull-remote) plugin, Node 22+ |
| [note-graph](note-graph/) | Read-only queries over a note-graph index of saved notes and tools | a note-graph index |
| [pricing-services](pricing-services/) | Prices freelance service work from your own transaction data and ends with a quote menu, a client message and a reusable price sheet | nothing (optional config) |
| [web-kit](web-kit/) | Makes the agent check a personal library of copy-in website recipes before writing UI from scratch | a web-kit recipe repo |

Kept in their own repos:

- **[localize](https://github.com/chrisye96/localize-skill)**: translating and localizing app and website UI, with placeholder, glossary and back-translation checks
- **practice-review**: reviews pronunciation practice in open-parler and writes the next sentence deck; it lives with that app because it calls its API

## Install

Clone the repo, then link the skills you want into the folder your agent reads. Linking instead of copying means a `git pull` updates the installed skills.

| Agent | User-level skills folder |
|---|---|
| Codex, Gemini CLI, OpenCode, and most others | `~/.agents/skills/` |
| Claude Code | `~/.claude/skills/` |

Other agents use their own folder (for example `.cursor/skills/` or `.github/skills/` in a project); check its docs. Linking into both folders above covers most agents at once.

macOS / Linux:

```bash
git clone https://github.com/chrisye96/agent-skills ~/agent-skills
ln -s ~/agent-skills/invoice ~/.agents/skills/invoice
ln -s ~/agent-skills/invoice ~/.claude/skills/invoice
```

Windows (PowerShell; a junction needs no admin rights):

```powershell
git clone https://github.com/chrisye96/agent-skills "$HOME\agent-skills"
New-Item -ItemType Junction -Path "$HOME\.agents\skills\invoice" -Target "$HOME\agent-skills\invoice"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\invoice" -Target "$HOME\agent-skills\invoice"
```

## Personal settings

Nothing personal is stored in this repo. A skill that needs a folder path or business details reads them from `~/.agents/skill-config/`, which lives outside the repo and outside any one agent's folder, so every agent finds the same settings. Each such skill ships a `config.example.md`: copy it to the path it names and fill it in. A skill without its config either falls back to a default or tells you what is missing; it never guesses.

| Config file | Used by | Required |
|---|---|---|
| `business.md` | invoice, pricing-services | invoice: yes; pricing-services: no |
| `note-graph.md` | note-graph | only if the index is not in `~/note-graph` |
| `web-kit.md` | web-kit | only if the repo is not at `~/source/repos/web-kit` |

The invoice skill also expects the business folder to hold its own documents (price book, ledger, client list, wording templates). The skill holds the workflow; your folder holds the facts and the client-facing wording.

## License

[MIT](LICENSE)
