// Persisted dark/light toggle for the markdown pane -- mirrors
// markdown-preview-theme-toggle.html's default-dark behavior from
// ~/myconf/dotfiles/vim/vimrc-functions.vim's PreviewMarkdown(), but
// scoped to .markdown-view instead of <body> and remembered across files
// via localStorage instead of per-render state.

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'repo-browser-markdown-theme';

function readStored(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function useMarkdownTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // private-browsing/storage-blocked -- theme just won't persist
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggle];
}
