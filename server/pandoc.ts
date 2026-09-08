// Renders a markdown file to an HTML *fragment* (no -s/--standalone --
// this gets injected into the app's own page, not opened as a standalone
// document) via pandoc, GFM-flavored to match GitHub's own rendering.
// Mirrors the spirit of ~/myconf/dotfiles/vim/vimrc-functions.vim's
// PreviewMarkdown(): pandoc for conversion, mermaid fenced blocks left
// as <pre class="mermaid"> for the frontend's mermaid.js pass, dark/light
// handled by the frontend's own scoped CSS instead of pandoc's --css.
// --embed-resources inlines any local images the markdown references.

import { execFileSync } from 'node:child_process';

let available: boolean | null = null;

export function pandocAvailable(): boolean {
  if (available === null) {
    try {
      execFileSync('pandoc', ['--version'], { stdio: 'ignore' });
      available = true;
    } catch {
      available = false;
    }
  }
  return available;
}

export function renderMarkdown(absPath: string): string | null {
  if (!pandocAvailable()) return null;
  try {
    return execFileSync('pandoc', [absPath, '-f', 'gfm', '--embed-resources'], {
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}
