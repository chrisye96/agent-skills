---
name: lr-label-exports
description: Find the Lightroom Classic catalog photos behind a folder of exported JPEGs and give them a colour label (or undo that), through the Cull Remote plugin's local API. Use whenever the user wants exported or delivered photos traced back to Lightroom and marked, for example "给作品集里的照片打绿色色标", "把这些导出的照片在 LR 里找出来", "标出交付给客户的照片", "which raws are these exports", "label my portfolio picks in Lightroom", or wants to know whether several export folders duplicate each other. Also use to undo such a labelling run.
---

# Label exported photos in Lightroom

Exports carry names like `251005_Ramjhat_Garba_DSCF6548_Web.jpg`; the catalog photo is `DSCF6548.RAF` (or `.dng`, `.NEF`, a virtual copy, a PSD). The scripts do the mechanical part: scan exports, index the catalog, match, write labels with an undo log. Your part is the judgement in between: deciding ambiguous matches, asking before replacing other colours, and reporting clearly.

## Before you start

- Lightroom must be open with the Cull Remote plugin enabled; the plugin starts the server on `http://127.0.0.1:47800`. Every script checks this and says what is wrong.
- Labels are written to the **real catalog**. Reading is always safe. To try the scripts without touching the catalog, run the dev instance from the cull-remote repo (`LRC_DEV=1 node server/index.js` plus `node spike/stand-in-plugin.mjs`) and pass `--base http://127.0.0.1:47810`.
- Needs Node 22 or newer. Scripts live in this skill's `scripts/`. Put the working files (`targets.json`, `catalog.json`, `matches.json`, previews) in the session scratchpad. Undo logs go to `~/.cache/lr-label-exports/` by themselves, because they must outlive the session.
- Only `rating`, `label` and `pickStatus` can be written through Cull Remote, so the worst a mistake can do is a wrong label, which `undo.mjs` reverts.

## Workflow

### 1. Scan the export folders

```bash
node scripts/scan-exports.mjs "<folder1>" "<folder2>" ... --out targets.json
```

It finds the camera file name (`DSCF`, `DSC_`, `CYV_`, `IMG_` plus four digits; change with `--pattern`) and the shoot date (the `YYMMDD_` export prefix, else the date in the embedded XMP). When the file name has no camera number, it reads `RawFileName` / `PreservedFileName` from the XMP, which is how `FinTech2025_Day1 (13).jpg` turned out to be DSCF1204.

Read its overlap report; the user often asks whether folders duplicate each other. It shows which set of folders holds each photo, files with the same name but different content (re-exported or re-edited), and identical files under different names. Typical finding: a dated download such as `Events-20251220T100456Z-1-001` is an older copy of `Events`; say which photos exist only in the old one, because the user may have dropped them on purpose. Do not delete or move export files; that is the user's call.

### 2. Index the catalog

```bash
node scripts/index-catalog.mjs --out catalog.json
```

Reads every folder (about a minute for 50,000 photos). Read only.

### 3. Match

```bash
node scripts/match.mjs targets.json catalog.json --out matches.json
```

A target matches a catalog photo with the same camera name shot within a day of the export date (`--days`), because events run past midnight. The camera counter wraps every 10,000 shots, so the same `DSCF0876` exists in several shoots; the date is what separates them. Then work through the sections:

- **UNIQUE**: nothing to decide.
- **MULTI**: the hint says why.
  - *virtual copies* (same file listed twice) or *several formats* of one shoot (RAF and DNG, NEF with its TIF and PSD): it is the same picture and you cannot tell which copy was exported, so label them all. That keeps a label filter complete.
  - *several folders* from different shoots, usually when the export had no date: compare by eye. Save the candidates' thumbnails with `node scripts/preview.mjs <dir> <id>...`, make a small copy of the export (below), view them with Read, and exclude the wrong candidates later with `--exclude-id`.
- **NONE**: look at the "same name, other shoot" lines and at `editedWith` in `targets.json`. Photos edited in Capture One as DNG, or shot on a phone, are often not in this catalog at all. Report them; do not label a same-named photo from another shoot.

Small copy of an export for viewing (full-size exports can be 10 MB):

```powershell
Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile("<export.jpg>"); $b=New-Object System.Drawing.Bitmap $i,400,([int](400*$i.Height/$i.Width)); $b.Save("<dir>\export.jpg"); $i.Dispose()
```

### 4. Dry run, then write

```bash
node scripts/apply-label.mjs matches.json --color green --exclude-id <ids> --dry
node scripts/apply-label.mjs matches.json --color green --exclude-id <ids>
```

It reads the current labels fresh, skips photos that already have the colour, and leaves photos with **another** colour alone, listing them. Lightroom keeps one colour per photo and the user may already use colours for other meanings, so ask before replacing them: name each photo, its current colour and its shoot. Only after a clear yes, run again with `--overwrite`. The user's request to label the photos is consent for the uncoloured ones; it is not consent to replace colours.

Each write reads the labels back and prints how many stuck, plus the path of its undo log. Report what did not stick.

### 5. Undo

```bash
node scripts/undo.mjs latest --dry
node scripts/undo.mjs latest
```

Restores the labels a run found (or pass a specific log path). Photos changed again since that run are skipped, so later work is kept.

## Reporting

Write the report in the user's language. Lead with the result, then the details:

1. How many exports were found and labelled, verified by reading back; how many catalog photos that is and why it can be more (virtual copies, several formats).
2. Folder overlap: which folders are old copies, what exists only in one of them, re-exported files.
3. Photos identified from embedded metadata or by comparing previews, and which candidate was ruled out.
4. Colours replaced (with the old colour) or still waiting for a decision.
5. Not found, with the likely reason.
6. The undo command.
