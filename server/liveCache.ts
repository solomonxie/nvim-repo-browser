// T2.3 (see docs/design/repo-browser-plan.md) -- in-memory, per-process
// cache keyed by relPath: { mtimeMs, size, payload }. getOrLoad() always
// stats first; only re-reads/re-walks when mtime+size differ from the
// cached entry. Never persisted to disk -- lives only for the server
// process's lifetime (one per nvim session). Ports the diff logic from the
// old src/indexer/cache.ts (pre-pivot), moved from a batch pre-pass to a
// live per-request check.

export {};
