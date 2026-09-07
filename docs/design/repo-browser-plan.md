# Implementation plan: repo-browser

See `docs/design/repo-browser.md` for the why. This is the what/order.

## Phase 1: Project scaffold & shared types
Foundation everything else builds on — build tooling config and the shared
data shape both the indexer and the app import from. Nothing else can start
without `RepoNode`/`RepoData` existing first.

- [x] T1.1 Vite/TS project scaffold (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `public/data.js` placeholder) — `base: './'` for file://, script-tag data loading not fetch — see `package.json` — depends: none
- [x] T1.2 Shared `RepoNode`/`RepoData` types (`src/types.ts`) — single source of truth for indexer output + app input — see `src/types.ts` — depends: none

## Phase 2: Indexer CLI
Turns a target repo into `data.js`. Only needs the Phase 1 types, so it can
be built in parallel with Phase 3. This is what makes "incremental
generation" real.

- [ ] T2.1 Directory walk + `.gitignore` filtering + binary/size classification (`src/indexer/walk.ts`) — recursive readdir, `ignore` package for gitignore semantics, NUL-byte sniff for binary detection, hardcoded `.git/` skip — see `src/indexer/walk.ts` — depends: T1.2
- [ ] T2.2 Incremental cache read/write (`src/indexer/cache.ts`) — mtime+size diff against a JSON cache file at a path passed in via CLI flag — see `src/indexer/cache.ts` — depends: T1.2
- [ ] T2.3 `data.js` emitter (`src/indexer/emit.ts`) — writes `window.__REPO_DATA__ = {...}` as a JS assignment, not JSON — see `src/indexer/emit.ts` — depends: T1.2
- [ ] T2.4 CLI entry (`src/indexer/cli.ts`) — argv parsing (target path, `--cache`, `--out`), wires walk+cache+emit together — see `src/indexer/cli.ts` — depends: T2.1, T2.2, T2.3

## Phase 3: React app shell
Renders whatever `window.__REPO_DATA__` holds. Only depends on the Phase 1
type contract, not on the indexer's internals — buildable in parallel with
Phase 2.

- [ ] T3.1 Hash-based router hook (`src/app/lib/router.ts`) — `window.location.hash` + `hashchange`, no react-router (pushState routing needs a server file:// doesn't have) — see `src/app/lib/router.ts` — depends: T1.2
- [ ] T3.2 Typed `window.__REPO_DATA__` accessor (`src/app/lib/repoData.ts`) — guards the "data.js never loaded" case with a friendly message instead of a crash — see `src/app/lib/repoData.ts` — depends: T1.2
- [ ] T3.3 `FileTree` + `Breadcrumb` components — recursive tree via native `<details>/<summary>` (free expand/collapse), path breadcrumb — see `src/app/components/FileTree.tsx`, `src/app/components/Breadcrumb.tsx` — depends: T3.2
- [ ] T3.4 `MarkdownView` + `CodeView` components — `react-markdown`+`remark-gfm`; `<pre><code>` + `hljs.highlightElement` via `useEffect`, explicit `vim` language registration (missing from hljs's common bundle) + a filename/extension→language lookup for extensionless dotfiles (`.zshrc`→bash, `.vimrc`→vim, `.gitconfig`→ini) — see `src/app/components/MarkdownView.tsx`, `src/app/components/CodeView.tsx` — depends: T3.2
- [ ] T3.5 `ContentPane` — dir → its README or a flat child listing; file → image/markdown/code/unsupported branches (binary/too-large placeholders) — see `src/app/components/ContentPane.tsx` — depends: T3.3, T3.4
- [ ] T3.6 `App.tsx` + `main.tsx` — layout shell wiring router + sidebar + breadcrumb + content pane, React mount point — see `src/app/App.tsx`, `src/app/main.tsx` — depends: T3.1, T3.5

## Phase 4: CLI wrapper & orchestration
Ties the indexer and the app build into the single `repo-browser <path>`
command, with the pinned runtime and the `/tmp` output contract. Needs both
Phase 2 and Phase 3 to exist and build cleanly.

- [ ] T4.1 `bin/repo-browser` bash entrypoint — pins `~/virtualnode/venv/bin/{node,npm}`, computes hash-keyed `/tmp/repo-browser/<hash>/`, conditionally (re)builds the app shell, runs the indexer via the local `tsx` binary, syncs shell assets into the output dir, `open`s the result unless `--no-open` — see `bin/repo-browser` — depends: T2.4, T3.6

## Phase 5: Docs & verification
Ship-readiness — usage docs, then the end-to-end checks from the design
doc's risk list.

- [ ] T5.1 `README.md` — real H1 title, usage, documented limitations (nested `.gitignore`, HCL highlighting gap) — see `README.md` — depends: T4.1
- [ ] T5.2 End-to-end verification against `~/workspace/coding-interviews` and a second target repo — zero-footprint check (`git status` stays clean in the target repo), no-fetch check (DevTools Network tab), highlighting check, incremental-speed check on a second run — see `docs/design/repo-browser.md` — depends: T4.1
