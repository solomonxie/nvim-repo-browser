-- T4.2: spawn/kill the Node server job, wait for its "listening on <port>"
-- line, and track one server per nvim instance (reuse if the root path
-- matches, else restart pointed at the new root).

local config = require('repo-browser.config')

local M = {}

local state = {
  handle = nil, -- vim.SystemObj
  root = nil,
  port = nil,
}

local function server_entry()
  return config.plugin_root() .. '/server/dist/index.js'
end

function M.is_running()
  return state.handle ~= nil
end

function M.current_root()
  return state.root
end

-- Starts the server (or reuses one already running for the same root).
-- on_ready(port) fires once the server reports it's listening;
-- on_error(message) fires if it never starts.
function M.start(opts, on_ready, on_error)
  if state.handle and state.root == opts.root then
    on_ready(state.port)
    return
  end
  if state.handle then
    M.stop()
  end

  local entry = server_entry()
  if vim.fn.filereadable(entry) == 0 then
    on_error(('server not built -- run `npm run build` in %s (%s not found)'):format(config.plugin_root(), entry))
    return
  end

  local node_bin = opts.node_bin or 'node'
  if vim.fn.executable(node_bin) == 0 then
    on_error(("'%s' not found on $PATH -- nvim-repo-browser needs Node to run its live server"):format(node_bin))
    return
  end

  local ready = false
  local stdout_buf = ''
  local handle

  handle = vim.system(
    { node_bin, entry, '--root', opts.root, '--port', tostring(opts.port or 0) },
    {
      stdout = function(_, data)
        if ready or not data then
          return
        end
        stdout_buf = stdout_buf .. data
        local bound_port = stdout_buf:match('listening on (%d+)')
        if bound_port then
          ready = true
          state.handle, state.root, state.port = handle, opts.root, tonumber(bound_port)
          vim.schedule(function()
            on_ready(state.port)
          end)
        end
      end,
      stderr = function(_, data)
        if data and not ready then
          vim.schedule(function()
            vim.notify('[repo-browser] ' .. data, vim.log.levels.WARN)
          end)
        end
      end,
    },
    function(result)
      if state.handle == handle then
        state.handle, state.root, state.port = nil, nil, nil
      end
      if not ready and result.code ~= 0 then
        ready = true -- suppress the timeout firing too
        vim.schedule(function()
          on_error(('server exited (%d) before it was ready'):format(result.code))
        end)
      end
    end
  )

  vim.defer_fn(function()
    if not ready then
      ready = true
      on_error('server did not report ready within 5s')
    end
  end, 5000)
end

function M.stop()
  if state.handle then
    state.handle:kill('sigterm')
    state.handle, state.root, state.port = nil, nil, nil
  end
end

return M
