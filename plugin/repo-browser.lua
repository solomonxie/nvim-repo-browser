-- T4.4: :RepoBrowser [path] and :RepoBrowserStop user commands, plus a
-- VimLeavePre autocmd that stops any running server so nothing outlives
-- this nvim session.

if vim.g.loaded_repo_browser then
  return
end
vim.g.loaded_repo_browser = true

vim.api.nvim_create_user_command('RepoBrowser', function(cmd_opts)
  local path = cmd_opts.args ~= '' and cmd_opts.args or nil
  require('repo-browser').open(path)
end, { nargs = '?', complete = 'dir', desc = 'Open a live GitHub-like browser for this repo' })

vim.api.nvim_create_user_command('RepoBrowserStop', function()
  require('repo-browser').stop()
end, { desc = 'Stop the nvim-repo-browser server' })

vim.api.nvim_create_autocmd('VimLeavePre', {
  group = vim.api.nvim_create_augroup('RepoBrowserCleanup', { clear = true }),
  callback = function()
    require('repo-browser').stop()
  end,
})
