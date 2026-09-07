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

-- Opens a live browser for `path` (default: cwd). Starts the server if
-- needed (or reuses one already running for that root), then opens the
-- system browser once it's ready.
function M.open(path)
  local root = vim.fn.fnamemodify(path or vim.fn.getcwd(), ':p'):gsub('/$', '')

  server.start(vim.tbl_extend('force', M.opts, { root = root }), function(port)
    local url = ('http://127.0.0.1:%d/'):format(port)
    vim.notify('[repo-browser] serving ' .. root .. ' at ' .. url)
    open_browser(url, M.opts)
  end, function(err)
    vim.notify('[repo-browser] ' .. err, vim.log.levels.ERROR)
  end)
end

function M.stop()
  server.stop()
end

return M
