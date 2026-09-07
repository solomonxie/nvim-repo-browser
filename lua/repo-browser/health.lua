-- :checkhealth repo-browser -- verifies Node is on $PATH and the server
-- has been built (see T5.2, docs/design/repo-browser-plan.md).

local config = require('repo-browser.config')

local M = {}

function M.check()
  vim.health.start('repo-browser')

  local opts = require('repo-browser').opts
  local node_bin = opts.node_bin or 'node'
  if vim.fn.executable(node_bin) == 1 then
    vim.health.ok(("'%s' found on $PATH"):format(node_bin))
  else
    vim.health.error(("'%s' not found on $PATH -- nvim-repo-browser needs Node to run its live server"):format(node_bin))
  end

  local entry = config.plugin_root() .. '/server/dist/index.js'
  if vim.fn.filereadable(entry) == 1 then
    vim.health.ok('server build found (' .. entry .. ')')
  else
    vim.health.error('server not built -- run `npm run build` in ' .. config.plugin_root())
  end
end

return M
