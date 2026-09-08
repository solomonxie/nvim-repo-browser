# Implementation plan: nvim-repo-browser

See `repo-browser.md` for the why. This is the what/order.

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
disk-persisted cache — see `repo-browser.md` Decision.

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

- [x] T5.1 `README.md` — real H1 title, lazy.nvim/packer install snippet
  with `build = "npm install && npm run build"` hook, documented
  limitations (nested `.gitignore`, HCL highlighting gap, Node
  `$PATH` requirement); GitHub repo description set to match. Empty
  `README.md` stubs added to every root-level structural folder
  (`doc/`, `docs/`, `frontend/`, `lua/`, `plugin/`, `server/`, `shared/`)
  per convention — depends: T4.4
- [ ] T5.2 `doc/repo-browser.txt` — `:help repo-browser`: commands, config
  options, `:checkhealth repo-browser` (Node on `$PATH`, port free) —
  depends: T4.4
- [ ] T5.3 End-to-end verification against `~/workspace/coding-interviews`
  and a second target repo: `:RepoBrowser` opens the browser; editing a
  file and reloading the tab shows the new content with no command re-run;
  `:qa` leaves no orphaned Node process (`ps`/`lsof -i` before/after);
  zero-footprint check (`git status` stays clean in the target repo) —
  depends: T5.1, T5.2

## Phase 6: Post-v1 enhancements
Requested after real interactive use. Not part of the original design doc's
v1 scope, but coherent extensions of it.

- [x] T6.1 Pandoc-based markdown rendering — tried, then reverted same
  session per "i like react to render it entirely": added a
  `server/pandoc.ts` shelling out to pandoc for GFM+mermaid, then removed
  it in favor of doing it all client-side (see T6.1r below), so the
  plugin has one fewer external runtime dependency. Nothing pandoc-shaped
  remains in the codebase — depends: T3.4
- [x] T6.1r Markdown rendering entirely in React (`MarkdownView.tsx`) —
  `react-markdown`+`remark-gfm` for GFM (tables/task-lists/strikethrough),
  a custom `code` component detects a ` ```mermaid ` fence and renders it
  via the `mermaid` npm package's `mermaid.render()` (one `<div>` per
  diagram, re-rendered on theme change), a custom `a` component reuses
  `resolveRelativeLink` (see T6.2) for in-app link routing, and any other
  fenced language runs through the same `hljs.highlightElement` pattern
  `CodeView.tsx` already uses. No server involvement in markdown at all
  beyond serving its raw text — depends: T6.1
- [x] T6.2 Fix: markdown links 404'd — a relative link's `href` resolves
  against the page's real URL path (always `/` under hash routing), not
  the current hash fragment, so `<a href="./other.md">` tried to navigate
  to `/other.md` instead of updating the hash. Fixed by intercepting link
  clicks (`frontend/src/lib/paths.ts`'s `resolveRelativeLink`, used by
  `MarkdownView.tsx`'s custom `a` component) and routing them through the
  app's own `onNavigate` instead of letting the browser navigate; external
  `http(s)` links get `target="_blank"` — depends: T6.1r
- [x] T6.3 File tree UI polish, GitHub-like (`frontend/src/components/
  icons.tsx`) — small inline-SVG folder/file icons (not a full icon
  library), tighter row spacing, rounded hover, indentation guide lines —
  kept simple per request — depends: none
- [x] T6.4 Top tabs like GitHub's Code/Issues/PRs: **Code** (existing
  browser) / **Commits** (Tig-like list via `git log`, click a commit for
  its full diff via `git show`) / **Branches** (local + remote via
  `git for-each-ref`) — depends: none
  - Server (`server/git.ts`): shells out to `git` (array args via
    `execFileSync`, never a shell — no injection risk regardless of ref
    content), `-c color.ui=false` guards against a global git config
    forcing ANSI codes into parsed output. `listCommits` pages via git
    log's own `<sha>~1` boundary (not offset-based, so it stays correct
    even if commits land while the list is open). New routes:
    `GET /api/commits[?before=&limit=]`, `GET /api/commit?sha=`,
    `GET /api/branches` — all 404 with `{error: 'not a git repository'}`
    when the target root has no `.git`
  - Router (`frontend/src/lib/router.ts`) rewritten from a bare path
    string to a `Route` union (`code`/`commits`/`branches`); an
    unrecognized/empty hash still defaults to Code so old bare-path links
    keep working
  - Frontend: `TopTabs.tsx`, `CommitList.tsx` (paged, "Load more"),
    `CommitDetail.tsx` (metadata + diff via `CodeView`'s existing `.diff`
    → highlight.js `diff` language mapping), `BranchList.tsx`
    (local/remote sections, current branch starred)

- [x] T6.5 Site-wide dark/light theme (`frontend/src/lib/theme.tsx`), not
  just the markdown pane — a `ThemeProvider`/`useTheme()` context, dark by
  default, toggled from the top bar (not per-view), persisted via
  `localStorage`. Every color in `styles.css` is a CSS custom property
  (`--bg`/`--fg`/`--muted`/`--border`/`--link`/`--surface`/etc.) redefined
  under `body.theme-light`, so the toggle now affects the sidebar, tabs,
  breadcrumb, and code/commit/insights views too, not just markdown.
  highlight.js has no scoped light+dark themes in one stylesheet, so its
  precompiled CSS is swapped by changing a single `<link>`'s `href`
  between `github.css`/`github-dark.css` (`?url` Vite imports) rather than
  statically importing both — depends: T6.1r
- [x] T6.6 Nested `.gitignore` support (`server/walk.ts`) — upgraded from
  root-only: `buildIgnoreChain` now reads every `.gitignore` from the repo
  root down to the directory being listed, rebasing each nested file's
  patterns onto its own directory (an unanchored bare name gets a `**/`
  prefix per gitignore's own "matches at any depth below this level"
  rule; an anchored or `/`-prefixed pattern is just prepended) before
  handing them all to one `ignore()` matcher — includes negation (`!`)
  correctly since patterns are added in root-to-leaf order and `ignore`
  implements git's last-match-wins semantics. Also handles the
  pytest/mypy/ruff-style "self-ignoring" cache directory convention
  (a `<dir>/.gitignore` containing a bare `*`) — no ancestor rule ever
  names `.pytest_cache` itself, yet `git status` still hides it because
  everything inside is ignored, so `isSelfIgnoring` replicates that by
  filtering any subdirectory whose own `.gitignore` is exactly `*`/`/*` —
  depends: T2.2
- [x] T6.7 Commits list reformatted, twice — first to a single-line
  `YYYY-mm-dd  author  commit_id  msg` row (`frontend/src/lib/format.ts`'s
  `shortDate`, plain ISO-string slicing, never a `Date` object, so no
  timezone-shift risk), then to GitHub's own grouped-by-day card layout
  (`CommitList.tsx`'s `groupByDay` + `.commit-group`/`.commit-card`): a
  "Commits on `<Month Day, Year>`" header per calendar day (`longDate`,
  also pure string math) followed by each commit as a card — bold
  subject, "`<author>` committed `<relativeTime>`", sha pill — matching a
  reference screenshot of github.com's commit list — depends: T6.4
- [x] T6.8 Branches tab replaced with **Insights** (`Insights.tsx`) — one
  flat page, sectioned, GitHub's Insights scoped to what's useful for a
  local repo:
  - **Contributors** (`ContributorsChart.tsx`) — commits per author via
    `git log --format=%an` tallied in JS, horizontal bars, one sequential
    hue (a ranked-magnitude comparison, not an identity comparison, so
    varying hue per bar would falsely imply a second dimension); capped
    at the top 20 with a "+N more" note
  - **Code frequency** (`CodeFrequencyChart.tsx`) — additions/deletions
    per week via `git log --pretty=format:@@%aI --numstat` (server/git.ts's
    `codeFrequency`, bucketed by ISO week via pure `Date.UTC` arithmetic,
    never a locale-dependent formatter), rendered as a diverging bar chart
    (additions up, deletions down from a shared zero baseline) — a
    genuine polarity measure, not a status-color reuse, and position
    (above/below the line) carries the signal primarily, green/red
    secondarily, matching the +/- diff convention already used elsewhere
    in this app
  - Branch listing itself (`server/git.ts`'s `listBranches`,
    `BranchList.tsx`, the `Branch`/`BranchList` types) removed outright,
    not just unlinked — depends: T6.4

Verified end-to-end via headless-Chromium screenshots against this repo's
own git history: theme toggle now recolors the whole app, not just
markdown; nested-`.gitignore` and self-ignoring-directory filtering
confirmed against `~/workspace/coding-interviews` (a real multi-package
repo with a pytest cache dir); Commits renders grouped cards matching the
reference screenshot; Insights' two charts render with real data from
this repo's own history.

## Phase 7: GitHub-style file view (v0.2.0)
Requested after comparing screenshots against github.com directly.

- [x] T7.1 `docs/` flattened to repo root — `docs/design/{repo-browser.md,
  repo-browser-plan.md}` → `repo-browser.md`/`repo-browser-plan.md`,
  `docs/images/screenshot.png` → `screenshot-code.png`/
  `screenshot-commits.png` (also replaced with two purpose-shot images:
  Code and Commits). `doc/` (singular, Neovim's own `:help` convention)
  is unrelated and stays — the two looked like a typo of each other but
  serve different masters (Neovim's runtime vs. this project's own docs)
  — depends: none
- [x] T7.2 Markdown/dark-theme rendering fixes found by screenshot diff
  against github.com: headings had no bottom border, fenced code blocks
  had no background at all (a leftover pandoc-era
  `.markdown-body pre code { background: none }` rule outranked
  highlight.js's own `.hljs` rule on specificity), highlight.js's
  github-dark.css background happened to equal the page background once
  restored (zero contrast, overridden to `--surface`), and dark-mode body
  text read gray instead of GitHub's brighter default — depends: T6.5
- [x] T7.3 GitHub's bordered file-view card (`FileBox.tsx`) — Preview/
  Code/Blame tabs (Preview only for markdown), a "N lines · size" meta
  line, a Raw link (`/raw/*` now defaults unknown extensions to
  `text/plain` instead of a download prompt). `ContentPane.tsx` picks
  which mode to show first (Preview for `.md`, Code otherwise) and hands
  `FileBox` a render-prop for Preview/Code content, since that's already
  `MarkdownView`/`CodeView` — depends: T3.5
- [x] T7.4 Blame mode (`server/git.ts`'s `blameFile`, `BlameView.tsx`) —
  `git blame --line-porcelain` on the file's *live working-tree* content
  (not just HEAD), so locally uncommitted edits show "Not committed yet"
  instead of being blamed on the wrong commit — consistent with this
  app's live-content philosophy elsewhere. Hand-parses porcelain format
  (a full metadata block on a commit's first appearance, a compact
  repeat-header for its later lines) since only the first occurrence of
  each commit carries author/time. Consecutive same-commit lines only
  show the gutter once, matching GitHub's own grouped blame display —
  depends: T6.4
- [x] T7.5 Version bumped to 0.2.0 (root/`frontend`/`server` `package.json`)

Verified end-to-end via headless-Chromium screenshots in both themes:
Preview/Code/Blame tabs switch correctly, Blame correctly shows "Not
committed yet" for this repo's own then-uncommitted README changes,
code-block contrast and heading underlines now match github.com.
