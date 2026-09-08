# nvim-hosted repo file browser

## Problem
A Doxygen prototype (tried first) hit two structural ceilings for browsing a
shell/dotfiles-style repo: no real syntax highlighting for shell/vim/yaml
(Doxygen only semantically parses C-family/Python/etc.), and folders
containing only markdown vanish from the file tree (Doxygen treats `.md` as
a "Page," not a "File"). Need a GitHub-like local file browser that fits
arbitrary repos, always shows current disk content, and requires no manual
regeneration step.

The first redesign (pure `file://`, zero background process ever) baked the
whole repo into a static `data.js` via a batch indexer CLI. That reintroduced
a manual "re-run to see your latest edits" step. Switching to an nvim-hosted
live server removes that step entirely: content is read from disk at the
moment you view it, not pre-baked.

## Goals
- Generic Neovim plugin, works against any target repo path (arg, or cwd)
- Content is always current: reading a file/directory means reading it live
  off disk *at that moment* — no regenerate/rebuild step, ever
- GitHub-like UX: folder tree, rendered README, syntax-highlighted code
- Zero footprint on the browsed repo — no files written into the target repo
- Server lifetime is scoped to the editor session — started on
  `:RepoBrowser`, killed on `:RepoBrowserStop` or `VimLeavePre`; nothing
  outlives nvim

## Non-goals
- Not hosted/multi-user — single local viewer, one nvim session
- No full-text code search (v1)
- No blame/diff-outside-of-commits browsing (Commits tab covers commit
  history + per-commit diffs; blame is out of scope)
- Not chasing 100% highlight.js language coverage (e.g. Terraform/HCL
  renders unhighlighted, accepted)
- No auto-push-on-file-change to an already-open browser tab (confirmed
  out of scope) — freshness is guaranteed *when you click/reload*, not via
  a file-watcher + WebSocket pushing updates into an idle tab

## Options considered
- **Doxygen** — free highlighting/xref for languages it parses, but wrong
  grain for a shell-heavy repo (see Problem). Rejected.
- **Static `file://` SPA + batch indexer CLI** (first redesign) — a Node CLI
  walked the repo once and baked a `window.__REPO_DATA__` snapshot into
  `data.js`; truly zero-server, but every edit needed a manual re-run to
  show up, and the whole tree had to be walked/read upfront even for a
  single-file view. Superseded by this design.
- **Pure-Lua server via `vim.uv` (libuv), in nvim's own process** — no
  subprocess, no runtime dependency beyond nvim, and could even reflect
  unsaved buffer content directly. Rejected for v1: HTTP/1.1 has no
  built-in parser in Lua (would need hand-rolled header/query parsing), and
  the confirmed requirement is disk content, not unsaved-buffer content —
  the buffer-awareness advantage doesn't apply here.
- **Node child process spawned by nvim, live per-request** — chosen: reuses
  `node:http` (mature, no hand-rolled HTTP parsing), Node is already a
  pinned runtime dependency of this project, and the plugin can spawn/kill
  it exactly like nvim already manages LSP server jobs.

## Decision
A Neovim plugin (`lua/repo-browser/`) exposes `:RepoBrowser [path]`, which
spawns a Node HTTP server (`server/`) as a background job rooted at the
target path, waits for it to report ready, and opens the system browser.
`:RepoBrowserStop` / a `VimLeavePre` autocmd kills the job.

The server serves a prebuilt React/TS SPA shell (`frontend/`, built once via
Vite into `dist-shell/` — same rendering stack as before: file tree,
breadcrumb, `react-markdown`+`remark-gfm` for markdown, `highlight.js` for
code) plus a small live JSON API:
- `GET /api/tree?path=<rel>` — one directory's immediate children, filtered
  by every `.gitignore` from the repo root down to that directory (lazy:
  only the directory being viewed, not the whole tree)
- `GET /api/file?path=<rel>` — text file content and classification
- `GET /raw/<rel>` — raw bytes for images (`<img src="/raw/...">` directly,
  no base64 data-URI embedding)

Every request `stat()`s the target path first — content is read fresh at
the moment it's requested, guaranteeing it reflects whatever's on disk right
then. An in-memory `Map<relPath, {mtimeMs, size, payload}>` inside the Node
process skips re-reading/re-walking only when the stat is unchanged since
the last time that path was served; it's a pure "skip redundant work"
optimization, never a source of staleness, and it lives only for the
server process's lifetime (no disk persistence, no separate cache file).

**Important clarification carried into this design** (this took several
rounds to align on): "prebuilt" applies only to the React *app shell*
(compiled once via `vite build`, like any TSX must be) — it never applies
to repo content. Every click on a file/folder triggers a live `fetch()` to
the running server, which reads disk at that instant. This is why no
file-watcher or auto-push mechanism is needed: freshness is guaranteed
*when you look*, not via background polling.

## Risks / open questions
- highlight.js has no HCL/Terraform grammar — accepted gap, documented in
  the README rather than switching highlighting libraries.
- Node must be on the end user's `$PATH` for the plugin to work at all —
  a real runtime dependency (unlike the rejected pure-Lua option), though
  already true of this machine's setup; `:checkhealth repo-browser` should
  surface a clear error if missing.
- One server per nvim instance, rooted at whatever path first opened it —
  calling `:RepoBrowser` with a *different* path restarts the server
  pointed at the new root (documented behavior, not a bug).
- If nvim is killed with `-9` (bypassing `VimLeavePre`), the Node child
  process can be orphaned — acceptable for a personal tool; `:RepoBrowserStop`
  is available as a manual escape hatch, and the process is harmless
  (read-only, localhost-bound) if it lingers.
