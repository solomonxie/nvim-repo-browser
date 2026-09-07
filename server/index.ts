// T2.4 (see docs/design/repo-browser-plan.md) -- Node http server entry
// point. Wires walk.ts + classify.ts + liveCache.ts together:
//   GET /                 -> ../dist-shell/index.html (built frontend shell)
//   GET /assets/*          -> ../dist-shell static assets
//   GET /api/tree?path=    -> DirListing (one directory level, live)
//   GET /api/file?path=    -> FileContent (live, cached by mtime+size)
//   GET /raw/*             -> raw bytes (images), streamed directly
// argv: --root <path> --port <n> (0 = OS-assigned). Logs a single
// "listening on <port>" line once bound -- the Lua side (server.lua) waits
// on that to know the server is ready before opening the browser.

export {};
