---
name: demo-menu
description: Build a dev-only demo panel that switches between design variants on the real pages of a web app, so the user can compare options in context (desktop and phone) before anything is implemented. Use whenever the user wants to see options before deciding, e.g. "做个demo", "出几个方案切换看看", "先demo来对比", "show me a few versions", "let me compare A and B on the site", "add it to the demo menu", or when you are about to propose two or more visual/UI/motion options for an existing page. Also use to add, prune or restyle rows of an existing demo panel, and when folding a chosen variant into real code.
license: MIT
---

# Demo menu

A small panel that lets the user flip between variants of several open design
questions on the live dev site, then pick. The questions are the product; the
panel is plumbing that should stay out of the way of the page being judged.

## Why this shape

- **Real page, not a mock.** Variants look different next to real content,
  real density and real photos. Build variants on the existing route.
- **One panel for all open questions.** Several stacked bars covered the page
  and were tedious to collapse. One compact panel holds every question as a row.
- **Out of the way by default.** A translucent chip docked in a corner; idle it
  fades to about half opacity. It opens on click or Alt+D and closes by itself
  1.2s after the mouse leaves, on a tap outside, or on Esc, so picking an
  option never needs a manual collapse. When it covers something, drag it (the
  chip, or the six-dot grip when open); on release it snaps to the nearest
  corner and remembers it.
- **Shareable.** Every choice is mirrored into the URL (`?name=key`), so a link
  reproduces the view on another device.

## Workflow

1. **Frame the questions.** One row per open decision. Variants must differ in
   substance (layout, hierarchy, motion), not only colour. Include the current
   design as a variant so the user can compare against it. List an already
   chosen option first: the first variant is the default.
2. **Give every option a code.** Each question gets one letter and each
   variant a number: `0` is the current design, `1`, `2`, ... are the options
   (F0 current, F1, F2; E1, E2, E3). Use the code as the variant `key`, so it
   shows in the panel badge, lands in the URL and appears in the CSS
   selectors. Use the same codes in the written proposal in chat, so the user
   can answer "F1, E3" and both sides mean the same thing. A code must keep
   meaning one thing for the life of the project, because the user will quote
   old codes back from memory:
   - **Letters are unique per project, not per panel.** If two questions would
     both start with F (footer, filter), the second takes another letter,
     ideally still mnemonic (filter could be L for "list"), else any unused
     one. Avoid two-letter codes; they are harder to say and type.
   - **A letter is never reassigned**, even after its question is decided and
     its row removed. A new question picks a letter never used before.
   - **Retired numbers stay retired.** If F1 is rejected, the next option for
     the same question is F3 (after F2), never a new F1. A reworked option also
     gets a new number.
   - **Keep a code ledger** as a comment at the top of the file that defines
     the questions: every letter with its question and status (open, decided:
     F2, dropped). Read it before assigning a letter.
3. **Install the panel once.** Copy `assets/DemoPanel.tsx` into the project's
   prototype folder (e.g. `components/prototype/`). It is plain React with
   inline styles, no dependencies. Mount it once in a layout every page shares,
   with a `QUESTIONS` array (`{ name, label, variants: [{ key, name }] }`,
   where `key` is the code from step 2).
4. **Wire each question** with one of two hooks the panel provides:
   - **Swap markup:** put `data-proto-<name>="<key>"` on each variant's root;
     the panel hides every non-current variant of that name.
   - **Restyle existing markup:** write CSS against
     `html[data-proto-<name>-active="<key>"] .selector` in one prototype CSS
     file. Good for motion, spacing and colour questions.
5. **Verify in the browser**, desktop and phone width, light and dark if the
   site has both. Then give the user the LAN URL of the dev server (for Next.js,
   `next dev` listens on all interfaces; find the IP with `ipconfig` or
   `ip addr`) so they can judge on their phone.
6. **Iterate.** When the user picks, keep the pick as the default but leave it
   a demo until they say to implement ("可以实装", "fold it in"). Users often
   decide several questions at once and want them landed together.
7. **Fold in and prune.** Rewrite the winner properly in real code (prototype
   code was written fast), delete its row, its CSS and its alternative markup.
   Never leave a decided question in the panel. When the last row goes, delete
   the panel, its mount and the prototype folder.

## Pitfalls seen in practice

- **Wrappers that own spacing must carry the attribute.** If only an inner
  element is tagged, the hidden variant leaves an empty margin behind.
- **Unlayered prototype CSS beats Tailwind utilities.** Useful for overrides,
  but a rule that sets the full `transition` list will silently cancel another
  demo's transition (an underline that should draw in just pops). List every
  property any demo animates, or target narrower selectors.
- **Never scale or translate full-width rows** (accordion headers, photos) in a
  press-feedback demo; inside a rounded card they show as a square block.
- **Do not touch the DOM before hydration.** A demo that sets inline styles from
  an effect can race client-only Suspense content and cause hydration warnings.
  For real implementations, render the hidden state from markup and CSS instead.
- **Hidden variants measure as zero.** A sliding indicator (tab underline,
  segmented pill) measured while its variant is hidden gets width 0 and stays
  wrong. Re-measure when the variant becomes active, on resize, and after
  `document.fonts.ready`.
- **Press effects belong on actions, not toggles.** Raised "paper press"
  shadows on small segmented buttons make their edges collide; toggles show
  feedback by becoming selected.
- **Next.js may rewrite the URL on first load**, occasionally resetting the
  restored choices; switching in the panel always works.
- **Production safety:** the panel returns null in production, but variant
  markup and prototype CSS do not. Everything must be folded in or deleted
  before deploying.

## Not React?

Port the same behaviour: a fixed corner chip, rows that cycle variants, an
injected `[data-proto-x]:not([data-proto-x="k"]){display:none!important}` rule
per row, the `html[data-proto-x-active]` attribute, the URL param, and the
auto-close rules above. Keep it dev-only.
