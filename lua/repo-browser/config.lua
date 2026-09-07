-- T4.1: default options and the one path-math helper shared by server.lua
-- and health.lua (this plugin's own root directory, computed from this
-- file's own location so it works regardless of where it's installed).

local M = {}

M.defaults = {
  port = 0, -- 0 = OS-assigned
  node_bin = 'node',
  open_cmd = nil, -- nil = auto-detect per OS (see init.lua)
}

function M.plugin_root()
  -- this file: <root>/lua/repo-browser/config.lua
  local src = debug.getinfo(1, 'S').source:sub(2)
  return vim.fn.fnamemodify(src, ':h:h:h')
end

return M
