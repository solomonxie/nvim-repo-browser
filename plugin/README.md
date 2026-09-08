# Command registration

Eager-loaded by Neovim at startup — defines `:RepoBrowser`/`:RepoBrowserStop`
and the `VimLeavePre` cleanup autocmd. Thin; the actual logic lives in `lua/`.
