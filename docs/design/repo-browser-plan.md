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
  `frontend/src/types.ts` → API response shapes (`DirEntry`/`DirListing`/
  `FileContent`, dropping the old whole-tree `RepoData`/
  `window.__REPO_DATA__`); `vite.config.ts` → `base: '/'`,
  `build.outDir: '../dist-shell'`; `index.html` → drop the `data.js` script
  tag — depends: T1.2

## Phase 2: Node live server
The core of the pivot: a small `node:http` server, spawned as a job by the
Lua plugin, that reads the target repo live per request. No batch step, no
disk-persisted cache — see `docs/design/repo-browser.md` Decision.

- [ ] T2.1 File classification (`server/classify.ts`) — text/image/
  binary/too-large, given a path+stat; ports `buildFileNode`'s
  classification logic from the old (removed) `src/indexer/walk.ts` —
  depends: none
- [ ] T2.2 Single-directory listing (`server/walk.ts`) — one level of
  `readdir`, root-`.gitignore` filtering via the `ignore` package, sorted
  dirs-then-files; ports the walk half of the old `walk.ts`, made lazy
  (one directory per call, not the whole tree) — depends: none
- [ ] T2.3 Live cache (`server/liveCache.ts`) — `getOrLoad(relPath, stat,
  loader)`: in-memory `Map` keyed by relPath storing `{mtimeMs, size,
  payload}`; always compares the fresh `stat()` first, only calls `loader`
  on a mismatch — depends: none
- [ ] T2.4 HTTP server entry (`server/index.ts`) — routes (`/`, static
  `dist-shell/` assets, `/api/tree`, `/api/file`, `/raw/*`), argv (`--root`,
  `--port`), logs `listening on <port>` once bound — wires T2.1–T2.3
  together — depends: T2.1, T2.2, T2.3

## Phase 3: Frontend adapted to the live API
Same rendering stack as originally speced (React/TS, react-markdown,
highlight.js), but data-sourced via `fetch()` against Phase 2's API instead
of a baked `window.__REPO_DATA__`, and lazy (fetch a directory's children on
expand, not the whole tree upfront).

- [ ] T3.1 Hash-based router hook (`frontend/src/lib/router.ts`) —
  `window.location.hash` + `hashchange` — depends: T1.3
- [ ] T3.2 API client (`frontend/src/lib/api.ts`) — typed `fetch()` wrappers
  for `/api/tree` and `/api/file`, replacing the old `window.__REPO_DATA__`
  accessor — depends: T1.3, T2.4
- [ ] T3.3 `FileTree` + `Breadcrumb` components — recursive tree via native
  `<details>/<summary>`, lazily calling `api.tree()` per directory on
  expand; path breadcrumb — depends: T3.2
- [ ] T3.4 `MarkdownView` + `CodeView` components — `react-markdown`+
  `remark-gfm`; `<pre><code>` + `hljs.highlightElement` via `useEffect`,
  explicit `vim` language registration + a filename/extension→language
  lookup for extensionless dotfiles (`.zshrc`→bash, `.vimrc`→vim,
  `.gitconfig`→ini) — depends: T3.2
- [ ] T3.5 `ContentPane` — dir → its README or a flat child listing (via
  `api.tree()`); file → image (`<img src="/raw/...">`)/markdown/code/
  unsupported branches (binary/too-large placeholders) — depends: T3.3, T3.4
- [ ] T3.6 `App.tsx` + `main.tsx` — layout shell wiring router + sidebar +
  breadcrumb + content pane, React mount point — depends: T3.1, T3.5

## Phase 4: Lua plugin wiring
Ties Phase 2's server to Neovim's job control — spawn/kill lifecycle,
commands, config.

- [ ] T4.1 Defaults (`lua/repo-browser/config.lua`) — port (`0` =
  OS-assigned), node binary path override, browser-open command override —
  depends: none
- [ ] T4.2 Server lifecycle (`lua/repo-browser/server.lua`) — spawn `node
  server/dist/index.js --root <path> --port <n>` via `vim.system`/`jobstart`,
  wait for its `listening on <port>` line, track one server per nvim
  instance (reuse if root matches, else restart), kill on demand —
  depends: T4.1, T2.4
- [ ] T4.3 Public API (`lua/repo-browser/init.lua`) — `setup(opts)`,
  `open(path?)`, `stop()` — wires T4.1+T4.2 — depends: T4.2
- [ ] T4.4 Commands (`plugin/repo-browser.lua`) — `:RepoBrowser [path]`,
  `:RepoBrowserStop`, `VimLeavePre` autocmd calling `stop()` — depends: T4.3

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
