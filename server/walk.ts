// T2.2 (see docs/design/repo-browser-plan.md) -- list one directory level
// (lazy, not the whole tree), filtered by the target repo's root
// .gitignore. Ports the directory-walk half of the old src/indexer/walk.ts,
// made lazy: only reads the requested directory, not the whole repo.

export {};
