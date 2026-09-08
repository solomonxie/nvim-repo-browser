# Live Repo Browser for Neovim

A GitHub-like file browser for any local repo, hosted entirely by Neovim.
`:RepoBrowser` spawns a small live server and opens it in your browser;
quitting Neovim shuts it down. Every click reads the file fresh off disk —
no indexing step, nothing to regenerate after an edit. Markdown renders via
pandoc (GFM, mermaid diagrams, dark/light toggle).

See `docs/design/repo-browser.md` for the why and
`docs/design/repo-browser-plan.md` for the implementation plan.

## Requirements
- Neovim 0.10+ (`vim.system`)
- Node on `$PATH` (runs the live server; `:checkhealth repo-browser` verifies)
- pandoc on `$PATH` (optional — renders markdown with GFM + mermaid diagrams;
  without it, markdown falls back to plain client-side rendering)

## Install

```lua
-- lazy.nvim
{
  'solomonxie/nvim-repo-browser',
  build = 'npm install && npm run build',
}
```

The build step compiles the frontend (`frontend/` → `dist-shell/`) and the
server (`server/` → `server/dist/`) — a one-time step, not run per use.

## Usage
- `:RepoBrowser [path]` — open a browser for `path` (default: cwd)
- `:RepoBrowserStop` — stop the running server
- `:checkhealth repo-browser` — verify Node is on `$PATH` and the server is built

One server per Neovim session: re-opening the same root reuses it; a
different root restarts it. Quitting Neovim (or `:RepoBrowserStop`) always
kills it — nothing is left running in the background.

## Limitations
- Root-level `.gitignore` only — nested `.gitignore` rules aren't applied
- No full-text search, no git history/blame/diff — current working tree only
- No syntax highlighting for Terraform/HCL (not in highlight.js)
- Freshness is per click/reload, not push — editing a file while its tab is
  already open needs a reload to see the change (no auto-refresh)
