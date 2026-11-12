---
name: note-graph
description: Read the user's note-graph index, which lists the bot-ingested notes and tools/ideas they have saved, queryable by topic. Use when asked "what do I have about X", "what notes/tools do I know", or to recall saved resources.
license: MIT
---

# /note-graph

A read-only view over the note-graph index built from the user's vault notes.
The index is maintained by the note-graph project; this skill only reads it.

The index folder is `~/note-graph` unless `~/.agents/skill-config/note-graph.md`
sets `index_dir` to another folder (format in this skill's `config.example.md`).

## Usage

```
/note-graph                 # summarize what exists (sources, counts, top tools)
/note-graph <topic>         # filter notes/tools relevant to <topic>
```

## What to do when invoked

1. Read the index files in the index folder:
   - `<index_dir>/TOOLS.md`  (curated tools/ideas)
   - `<index_dir>/index.json` (full per-note index)

   If neither exists, tell the user the index has not been built yet (the
   note-graph weekly cron, or `python build.py stage && merge`, populates it).

2. If a `<topic>` was given, filter `index.json` notes and `TOOLS.md` entries
   whose title/topics/tools/summary match the topic. Otherwise give an overview:
   counts per `source`, and the top tools by `mentioned_in` length.

3. Answer using ONLY what the index contains. Each note carries a `source`
   (`inbox` or `personal`); always preserve and show provenance, never blend
   the two. Quote the note `path` when citing.

4. Do not write anything. This skill is read-only.
