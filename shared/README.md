# Shared types

The `DirEntry`/`FileContent`/`CommitSummary`/etc. contract both `frontend/`
and `server/` import — kept as `.d.ts` since it's pure interfaces, so
neither side ever needs to build it.
