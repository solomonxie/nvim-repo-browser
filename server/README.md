# Live server

The Node `http` server the Lua plugin spawns — reads the target repo's files
live per request (never a batch/regenerate step) and shells out to `git` for
Commits/Insights. Built once via `npm run build` into `dist/`.
