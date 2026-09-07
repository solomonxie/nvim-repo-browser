# Implementation plan: nvim-repo-browser

See `docs/design/repo-browser.md` for the why. This is the what/order.

## Phase 1: Repo rename & plugin skeleton
Pivoted from a static `file://` SPA to an nvim-hosted live server (see
design doc). Renamed repo/folder, restructured into an nvim plugin layout,
moved the existing frontend scaffold aside, dropped what no longer fits.

- [x] T1.1 Rename GitHub repo + local folder to `nvim-repo-browser`,
  update `origin` remote — depends: none
- [x] T1.2 Restructure into plugin layout: `frontend/` (moved scaffold:
  `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`,
  `src/types.ts`), `server/`, `lua/repo-browser/`, `plugin/`, `doc/`
  skeletons; removed `src/indexer/*` and `public/data.js` (superseded);
  root `package.json` with `build`/`build:frontend`/`build:server`
  orchestration scripts — depends: none
- [x] T1.3 Update moved scaffold for the new architecture:
  `shared/types.d.ts` (moved again during Phase 2, from
  `frontend/src/types.ts`, to a repo-root `shared/` so both `frontend/` and
  `server/` — separate TS projects — import the same source of truth; it's
  a `.d.ts` since it's pure interfaces, so neither project ever needs to
  emit or build it) → API response shapes (`DirEntry`/`DirListing`/
  `FileContent`, dropping the old whole-tree `RepoData`/
  `window.__REPO_DATA__`); `vite.config.ts` → `base: '/'`,
  `build.outDir: '../dist-shell'`; `index.html` → drop the `data.js` script
  tag — depends: T1.2

## Phase 2: Node live server
The core of the pivot: a small `node:http` server, spawned as a job by the
Lua plugin, that reads the target repo live per request. No batch step, no
disk-persisted cache — see `docs/design/repo-browser.md` Decision.

- [x] T2.1 File classification (`server/classify.ts`) — text/image/
  binary/too-large, given a path+stat; ports `buildFileNode`'s
  classification logic from the old (removed) `src/indexer/walk.ts` —
  depends: none
- [x] T2.2 Single-directory listing (`server/walk.ts`) — one level of
  `readdir`, root-`.gitignore` filtering via the `ignore` package, sorted
  dirs-then-files; ports the walk half of the old `walk.ts`, made lazy
  (one directory per call, not the whole tree). Gotcha hit + fixed: the
  `ignore` package only matches directory-only gitignore patterns (e.g.
  `node_modules/`) when the tested path itself carries a trailing slash —
  depends: none
- [x] T2.3 Live cache (`server/liveCache.ts`) — `getOrLoad(relPath, stat,
  loader)`: in-memory `Map` keyed by relPath storing `{mtimeMs, size,
  payload}`; always compares the fresh `stat()` first, only calls `loader`
  on a mismatch — depends: none
- [x] T2.4 HTTP server entry (`server/index.ts`) — routes (`/`, static
  `dist-shell/` assets, `/api/tree`, `/api/file`, `/raw/*`), argv (`--root`,
  `--port`), logs `listening on <port>` once bound — wires T2.1–T2.3
  together. Built as CommonJS (not ESM/NodeNext) — sidesteps both the
  `ignore` package's NodeNext/ESM default-export interop typing quirk and
  the need for explicit `.js` extensions on every relative import; `tsc`'s
  outDir nesting is kept flat (`server/dist/index.js`, not
  `server/dist/server/index.js`) precisely because `shared/types.d.ts` is a
  declaration file and never enters emit — depends: T2.1, T2.2, T2.3

## Phase 3: Frontend adapted to the live API
Same rendering stack as originally speced (React/TS, react-markdown,
highlight.js), but data-sourced via `fetch()` against Phase 2's API instead
of a baked `window.__REPO_DATA__`, and lazy (fetch a directory's children on
expand, not the whole tree upfront).

- [x] T3.1 Hash-based router hook (`frontend/src/lib/router.ts`) —
  `window.location.hash` + `hashchange` — depends: T1.3
- [x] T3.2 API client (`frontend/src/lib/api.ts`) — typed `fetch()` wrappers
  for `/api/tree` and `/api/file`, replacing the old `window.__REPO_DATA__`
  accessor — depends: T1.3, T2.4
- [x] T3.3 `FileTree` + `Breadcrumb` components — recursive tree via native
  `<details>/<summary>`, lazily calling `api.tree()` per directory on
  expand; path breadcrumb — depends: T3.2
- [x] T3.4 `MarkdownView` + `CodeView` components — `react-markdown`+
  `remark-gfm`; `<pre><code>` + `hljs.highlightElement` via `useEffect`. Uses
  highlight.js's full default bundle (every language it ships, vim
  included) rather than the core+"common"-subset build, so no manual `vim`
  registration is needed; still keeps the filename/extension→language
  lookup for extensionless dotfiles hljs's own auto-detection gets wrong
  (`.zshrc`→bash, `.vimrc`→vim, `.gitconfig`→ini) — depends: T3.2
- [x] T3.5 `ContentPane` — dir → its README or a flat child listing (via
  `api.tree()`); file → image (`<img src="/raw/...">`)/markdown/code/
  unsupported branches (binary/too-large placeholders). Whether `path` is a
  file or directory is resolved live (`/api/file` 404s on a directory via
  the server's `readFileSync` EISDIR), not tracked by the router — depends:
  T3.3, T3.4
- [x] T3.6 `App.tsx` + `main.tsx` — layout shell wiring router + sidebar +
  breadcrumb + content pane, React mount point — depends: T3.1, T3.5

Verified end-to-end with a headless-Chromium screenshot pass: file tree,
breadcrumb, README markdown rendering, and syntax-highlighted `.ts` code all
confirmed visually.

## Phase 4: Lua plugin wiring
Ties Phase 2's server to Neovim's job control — spawn/kill lifecycle,
commands, config.

- [x] T4.1 Defaults (`lua/repo-browser/config.lua`) — port (`0` =
  OS-assigned), node binary path override, browser-open command override;
  also holds `plugin_root()`, the this-file's-own-location path helper
  shared by `server.lua` and `health.lua` — depends: none
- [x] T4.2 Server lifecycle (`lua/repo-browser/server.lua`) — spawns `node
  server/dist/index.js --root <path> --port <n>` via `vim.system`, waits
  for its `listening on <port>` line (scanned from stdout, 5s timeout),
  tracks one server per nvim instance (reuse if root matches, else
  restart), kill on demand — depends: T4.1, T2.4
- [x] T4.3 Public API (`lua/repo-browser/init.lua`) — `setup(opts)`,
  `open(path?)`, `stop()` — wires T4.1+T4.2, opens the system browser
  (`open`/`xdg-open`/`start`, OS-detected) once the server reports ready —
  depends: T4.2
- [x] T4.4 Commands (`plugin/repo-browser.lua`) — `:RepoBrowser [path]`,
  `:RepoBrowserStop`, `VimLeavePre` autocmd calling `stop()` — depends: T4.3
- [x] T4.5 (added, not originally planned) `:checkhealth repo-browser`
  (`lua/repo-browser/health.lua`) — Node-on-`$PATH` + server-build-exists
  checks, implemented alongside the rest of the plugin wiring rather than
  deferred to Phase 5 — depends: T4.1

Verified end-to-end against real Neovim 0.11 (headless, `rtp`-installed):
`:RepoBrowser <path>` starts the server and reports its URL; a second
`:RepoBrowser` call on the same root reuses it; `:RepoBrowserStop` and
`VimLeavePre` both correctly kill the Node process (confirmed via `ps` +
a failed `curl` after quit — no orphaned process); opening a different root
after stopping starts a fresh server. (Test caveat: `-u NONE` alone sets
`loadplugins=false`, which skips the automatic `plugin/*.lua` sourcing
pass entirely — a real plugin-manager install doesn't hit this, but a
from-scratch headless test needs `--cmd "set loadplugins"` restored, plus
`--clean` instead of bare `-u NONE` to avoid pulling in unrelated plugins
already on the default runtimepath.)

## Phase 5: Packaging, docs & verification
Ship-readiness — install instructions, help doc, end-to-end checks.

- [ ] T5.1 `README.md` — real H1 title, lazy.nvim/packer install snippet
  with `build = "npm install && npm run build"` hook, documented
  limitations (nested `.gitignore`, HCL highlighting gap, Node
  `$PATH` requirement) — depends: T4.4
- [ ] T5.2 `doc/repo-browser.txt` — `:help repo-browser`: commands, config
  options, `:checkhealth repo-browser` (Node on `$PATH`, port free) —
  depends: T4.4
- [ ] T5.3 End-to-end verification against `~/workspace/coding-interviews`
  and a second target repo: `:RepoBrowser` opens the browser; editing a
  file and reloading the tab shows the new content with no command re-run;
  `:qa` leaves no orphaned Node process (`ps`/`lsof -i` before/after);
  zero-footprint check (`git status` stays clean in the target repo) —
  depends: T5.1, T5.2
