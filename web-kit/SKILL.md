---
name: web-kit
description: Check the user's personal web-kit recipe library before writing any website UI from scratch, and copy a recipe instead of rewriting it. Use whenever building, redesigning or polishing a website or web app page, especially navbars and mobile menus, hero or full-bleed photos, page transitions and scroll reveals, sliding underlines and tabs, button press feedback, error and 404 pages, iOS Safari status bar or toolbar colour problems, safe areas, or testing on a real phone or iPad. Also use when the user says 复用, 组件库, web-kit, "do we have something for", "like on cyvisuals", or when you finish improving something that came from a recipe.
---

# web-kit

A copy-in library of website pieces that were worked out the hard way, mostly
on real iPhones and iPads. Each recipe carries its code, the exact steps to
wire it in, and the traps that cost real-device test rounds. Rewriting one
from memory throws all of that away.

Repo (written `<web-kit>` below): `~/source/repos/web-kit`, unless
`~/.claude/skill-config/web-kit.md` sets `repo` to another folder (format in this
skill's `config.example.md`). Index: `<web-kit>/CATALOG.md`.

## Before writing UI

1. **Read `CATALOG.md` first.** Match by name, summary and the tag index
   (navbar, menu, hero, ios, safari, motion, touch, error, ...).
2. **If a recipe fits, open its folder's `README.md`** and check
   「什么时候用 / 不用」. Tell the user which recipe you are reusing.
3. **Copy the files, don't retype them.** Then restyle: map the token names
   (`--color-bg`, `--color-foreground`, `--color-muted`, `--color-accent`, ...)
   to the project's own, and fix import paths.
4. **Follow 「怎么接入」 step by step and read 「坑」 before changing
   anything.** The traps explain why code that looks redundant is there (a
   100px line scaled down instead of a 1px line, a backdrop on a child
   instead of the header, `display: none` instead of `visibility: hidden`).
   Do not "simplify" those away.
5. **Run 「验证方法」.** Anything touching the browser's edges (status bar,
   toolbar, safe areas) can only be judged on a real device; desktop
   emulators do not draw the browser's own bars. Use the
   `device-probe-page` recipe instead of guessing.

If nothing fits, build it normally. If the result is likely to be needed on
a second site, offer to add it as a recipe (below).

## After reusing or improving a recipe

When the project version ends up better than the recipe (a bug fixed, a new
device fact, a cleaner API):

1. Update the recipe's code and README in web-kit (keep it generic: tokens,
   props, no project photos or data).
2. Add the new trap or device fact to 「坑」 and, if it is a lesson, point to
   the notebook section in `notes`.
3. Regenerate the index:

   ```bash
   node "<web-kit>/scripts/build-catalog.mjs"
   ```

4. Do not commit in web-kit unless the user asks.

## Adding a new recipe

Only when a second site needs the piece; do not collect speculatively.

1. Create `recipes/<slug>/` with the code and a `README.md`.
2. Frontmatter: `name`, `summary` (one line), `tags` (inline list), `stack`,
   `status` (stable, or experimental when verified on one device only or with
   a known gap), `origin` (project, branch, commit or uncommitted, date),
   `notes` (block list of notebook sections that hold the why).
3. Body sections, in Chinese prose is fine: 用途, 什么时候用 / 不用, 怎么接入
   (exact files and steps), 坑, 验证方法.
4. Code and comments in English. Generalise: colours become tokens, data
   becomes props, each file's header comment ends with a `Known limits:`
   line. Lucide for icons. No dashes as clause separators in prose.
5. Run `build-catalog.mjs` (above) and check the new row in `CATALOG.md`.

The full conventions are in the repo's `README.md`.
