# Code tab

```
┌──────────────────────────────────────────────────────────────┐
│ [ CODE ] [ Commits ] [ Insights ]                        ☀   │ ← theme
├───────────────────┬──────────────────────────────────────────┤   toggle,
│ ⌄ 📁 ansible      │ myconf / llm / claude / skills           │   global
│   › 📁 roles      │ ┌──────────────────────────────────────┐ │
│ ⌄ 📁 llm          │ │ ⌄ 14 items                           │ │ ← collapsed
│   ⌄ 📁 claude     │ │ 📁 ..                                │ │   by default
│     › 📁 skills   │ │ 📁 uiux                              │ │
│       📄 README.md│ │ 📄 README.md                         │ │
│ › 📁 nvim         │ └──────────────────────────────────────┘ │
│   📄 README.md    │ ┌ README.md ───────────────────────  🖨 ┐ │
│                   │ │ # Skills                             │ │ ← a folder's
│ ⟳ Loading…        │ │ rendered markdown, mermaid diagrams  │ │   README is
│                   │ │ rendered too, code blocks highlighted│ │   the page
└───────────────────┴──────────────────────────────────────────┘
                      myconf / llm / claude / skills            ← print-only
                                                                  footer
```

Every breadcrumb segment is a link; the first is the repo's own name, read
live from the server.

## A file

```
┌──────────────────────────────────────────────────────────────┐
│ ┌ [ PREVIEW | Code | Blame ]                          🖨 ┐   │ ← Preview
│ │ rendered markdown                                     │   │   only for
│ └───────────────────────────────────────────────────────┘   │   .md
│ ┌ [ CODE | Blame ]                                     🖨 ┐ │
│ │  1  local M = {}                                      │ │ ← highlight.js
│ │  2                                                    │ │   by extension
│ └───────────────────────────────────────────────────────┘ │
│ ┌ [ Code | BLAME ]                                     🖨 ┐ │
│ │ solomonxie  3 days ago │ local M = {}                 │ │ ← gutter groups
│ │                        │                              │ │   consecutive
│ │ Not committed yet      │ local new = 1                │ │   lines from one
│ └───────────────────────────────────────────────────────┘ │   commit
└──────────────────────────────────────────────────────────────┘
```

## States

```
 loading        Loading…
 error          <the server's own message>
 image          shown inline at raw URL
 too large      File too large to display (4194304 bytes).
 binary         Binary file not shown.
 not a git repo Not a git repository.        ← Commits/Blame only
```

Whether a path is a file or a directory is resolved live — `/api/file`
404s on a directory — so the router never has to track entry types, and
content is always what is on disk *now*.

## Print

`🖨` prints the current box. The print stylesheet drops the tree, the tabs
and the theme toggle, shrinks markdown images, and adds the repo/path
footer — a printed page has no cursor, so nothing that needs one survives.
