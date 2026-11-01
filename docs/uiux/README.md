# UI/UX mockups — nvim-repo-browser

Two interfaces: the nvim commands that start it, and the browser UI they
open. Drawn as built today. `../../repo-browser.md` carries the problem and
the decision.

Glyphs follow the `uiux` skill (`references/notation.md` + `text-figma.md`):
`[ A | B ]` tabs (selected in CAPS) · `›`/`⌄` collapsed/open · `⟳` working ·
`←` annotation.

## Surface map

```
 nvim
  :RepoBrowser [path]  ─▶ starts the server, opens the browser
  :RepoBrowserStop     ─▶ kills it   (VimLeavePre does too)
        │
        ▼
 browser  [ CODE | Commits | Insights ]            ☀/🌙
   ├ Code      file tree │ breadcrumb + content
   │                       dir  ─▶ item count box + rendered README
   │                       file ─▶ [ PREVIEW | Code | Blame ]  🖨
   ├ Commits   day-grouped cards ─▶ one commit's detail
   └ Insights  Contributors · Code frequency
```

## Files

| File | Covers |
|---|---|
| `editor.md` | the nvim side: commands, messages, lifetime |
| `code.md` | Code tab — tree, breadcrumb, dir and file views |
| `commits.md` | Commits and Insights tabs |
