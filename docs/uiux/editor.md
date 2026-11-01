# The editor side

`plugin/repo-browser.lua` — two commands and nothing else. No window, no
buffer, no statusline item: the UI is the browser.

```
 :RepoBrowser              ← the cwd
 :RepoBrowser ~/myconf     ← any path, tab-completed as a directory
 :RepoBrowserStop
 VimLeavePre ⇒ the same stop — nothing outlives nvim
```

Messages, all of them:

```
 first run   [repo-browser] building (first run only,
             npm install && npm run build)...              INFO
 no opener   [repo-browser] unknown OS -- open manually:
             http://127.0.0.1:PORT                         WARN
 server said [repo-browser] <stderr line>                  WARN
 failed      [repo-browser] <error>                         ERROR
```

The build message names *why* the wait is happening and that it happens
once — a silent 30-second first run reads as a hang.
