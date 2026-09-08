-- T4.3: public API -- setup(opts), open(path?), stop(). Wires
-- config.lua's defaults to server.lua's job lifecycle and opens the
-- system browser once the server reports ready.

local config = require('repo-browser.config')
local server = require('repo-browser.server')

local M = {}

M.opts = vim.deepcopy(config.defaults)

function M.setup(opts)
  M.opts = vim.tbl_deep_extend('force', config.defaults, opts or {})
end

local function open_browser(url, opts)
  local cmd = opts.open_cmd
  if cmd then
    cmd = vim.list_extend(vim.deepcopy(cmd), { url })
  elseif vim.fn.has('mac') == 1 then
    cmd = { 'open', url }
  elseif vim.fn.has('win32') == 1 then
    cmd = { 'cmd.exe', '/c', 'start', '', url }
  elseif vim.fn.has('unix') == 1 then
    cmd = { 'xdg-open', url }
  else
    vim.notify('[repo-browser] unknown OS -- open manually: ' .. url, vim.log.levels.WARN)
    return
  end
  vim.system(cmd, { detach = true })
end

-- Percent-encodes one path segment the same way router.ts's encode() does
-- (encodeURIComponent), so a highlighted path with spaces/unicode/etc.
-- round-trips through its decodeURIComponent(hash) on load.
local function url_encode_segment(seg)
  return (seg:gsub('[^%w%-%_%.%~]', function(c)
    return string.format('%%%02X', c:byte())
  end))
end

-- git rev-parse in `dir`: repo toplevel + `dir`'s prefix within it (e.g.
-- "src/lib/"), or nil if `dir` isn't inside a git work tree.
local function git_location(dir)
  local out = vim.fn.systemlist({ 'git', '-C', dir, 'rev-parse', '--show-toplevel', '--show-prefix' })
  if vim.v.shell_error ~= 0 or #out < 1 then
    return nil, nil
  end
  return out[1], out[2] or ''
end

-- Resolves what to open when no explicit path was given: the current
-- buffer's file, highlighted, rooted at its git repo (falling back to cwd
-- for an unnamed buffer or a file outside any repo).
local function current_buffer_target()
  local bufname = vim.api.nvim_buf_get_name(0)
  if bufname == '' or vim.fn.filereadable(bufname) == 0 then
    return vim.fn.getcwd(), nil
  end

  local dir = vim.fn.fnamemodify(bufname, ':p:h')
  local toplevel, prefix = git_location(dir)
  if not toplevel then
    return vim.fn.getcwd(), nil
  end

  local filename = vim.fn.fnamemodify(bufname, ':t')
  return toplevel, prefix .. filename
end

-- Opens a live browser for `path` (default: the current buffer's file, or
-- cwd if the buffer has no file). Starts the server if needed (or reuses
-- one already running for that root), then opens the system browser once
-- it's ready -- deep-linked to the current file when there is one, so the
-- file tree opens expanded and highlighted at the right place.
function M.open(path)
  local root, highlight
  if path then
    root = vim.fn.fnamemodify(path, ':p'):gsub('/$', '')
  else
    root, highlight = current_buffer_target()
  end

  server.start(vim.tbl_extend('force', M.opts, { root = root }), function(port)
    -- quiet on success -- the opened browser tab is the confirmation
    local url = ('http://127.0.0.1:%d/'):format(port)
    if highlight and highlight ~= '' then
      local segments = {}
      for seg in highlight:gmatch('[^/]+') do
        table.insert(segments, url_encode_segment(seg))
      end
      url = url .. '#/code/' .. table.concat(segments, '/')
    end
    open_browser(url, M.opts)
  end, function(err)
    vim.notify('[repo-browser] ' .. err, vim.log.levels.ERROR)
  end)
end

function M.stop()
  server.stop()
end

return M
