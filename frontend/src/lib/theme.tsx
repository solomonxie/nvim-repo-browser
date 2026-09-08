// Site-wide dark/light theme -- not just the markdown pane. Dark by
// default. Persisted via localStorage; toggles a class on <body> that
// every stylesheet rule keys off (see styles.css's CSS custom
// properties), and swaps which highlight.js theme stylesheet is active
// (its precompiled themes aren't scoped, so only one can be loaded at a
// time -- swapping a single <link>'s href, not two static imports).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import hljsDarkUrl from 'highlight.js/styles/github-dark.css?url';
import hljsLightUrl from 'highlight.js/styles/github.css?url';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'repo-browser-theme';
const HLJS_LINK_ID = 'hljs-theme';

function readStored(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStored);

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');

    let link = document.getElementById(HLJS_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = HLJS_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = theme === 'light' ? hljsLightUrl : hljsDarkUrl;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // private-browsing/storage-blocked -- theme just won't persist
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
