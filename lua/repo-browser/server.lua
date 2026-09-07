-- T4.2 (see docs/design/repo-browser-plan.md) -- spawn/kill the Node
-- server job, wait for its "listening on <port>" line, and track one
-- server per nvim instance (reuse if the root path matches, else restart).

return {}
