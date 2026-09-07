# Zero-server repo file browser

## Problem
A Doxygen prototype (tried first) hit two structural ceilings for browsing a
shell/dotfiles-style repo: no real syntax highlighting for shell/vim/yaml
(Doxygen only semantically parses C-family/Python/etc.), and folders
containing only markdown vanish from the file tree (Doxygen treats `.md` as
a "Page," not a "File"). Need a GitHub-like local file browser that fits
arbitrary repos, opens with zero setup (double-click, no server), and can be
regenerated cheaply after edits.

## Goals
- Generic CLI, works against any target repo path
- True `file://` zero-server — no background process required to view
- Incremental regeneration: re-run is fast, doesn't rebuild the whole app
- GitHub-like UX: folder tree, rendered README, syntax-highlighted code
- Zero footprint on the browsed repo — no files written into the target repo
- Self-contained runtime — pins its own node/npm, not dependent on the
  caller's shell `$PATH`

## Non-goals
- Not hosted/multi-user — single local viewer
- No full-text code search (v1)
- No nested `.gitignore` support — root-level only (v1)
- No git history/blame/diff browsing — current working tree only
- Not chasing 100% highlight.js language coverage (e.g. Terraform/HCL
  renders unhighlighted, accepted)

## Options considered
- **Doxygen** — free highlighting/xref for languages it parses, but wrong
  grain for a shell-heavy repo (see Problem). Rejected.
- **pandoc + custom glue script** — handles markdown+highlighting well, but
  the GitHub-like chrome (tree nav, routing, breadcrumbs) is 100% custom
  regardless. A React SPA gives the same custom-glue cost with better
  client-side interactivity (instant nav, collapsible tree) than
  pre-rendering one static HTML file per source file.
- **Existing local git browsers** (gitea, `git instaweb`, cgit, Sourcegraph
  `src serve-local`) — all require a background server process. Ruled out
  by the zero-server requirement.
- **Custom React/TypeScript SPA + Node indexer CLI** — chosen: full control
  over UX/data flow, client-side rendering keeps the generator fast, and
  splits the rarely-changing app shell from the frequently-regenerated data
  for real incremental speed.

## Decision
Build a small React/TS SPA (Vite, `base: './'`) that reads a
`window.__REPO_DATA__` object injected via a plain `<script>` tag — not
`fetch()`, which `file://` blocks for local files. A separate Node CLI
indexer walks a target repo (respecting its root `.gitignore`), classifies
files (text / image / binary / too-large), and emits that data as a JS
assignment (`data.js`). A bash CLI wrapper (`bin/repo-browser`) pins the
user's own node/npm (`~/virtualnode/venv/bin/{node,npm}`) rather than
trusting `$PATH`, builds the app shell once (cached in the tool's own
`dist-shell/`), and on every subsequent invocation only re-runs the cheap
indexer step, writing output to `/tmp/repo-browser/<hash-of-target-path>/`
— never into the browsed repo. Markdown (`react-markdown` + `remark-gfm`)
and syntax highlighting (`highlight.js`) both render client-side from raw
text, keeping the indexer itself simple and fast.

## Risks / open questions
- highlight.js has no HCL/Terraform grammar — accepted gap, documented in
  the README rather than switching highlighting libraries.
- Root-only `.gitignore` support may under-filter repos that rely on nested
  `.gitignore` rules — documented v1 limitation.
- `/tmp` is ephemeral (cleared on reboot) — acceptable, since regeneration
  is cheap; the cache's speed benefit just resets after a reboot.
- The pinned `~/virtualnode/venv/bin/{node,npm}` path is specific to this
  machine — fine for a personal tool, would need a config/`$PATH` fallback
  to generalize to another user's setup.
