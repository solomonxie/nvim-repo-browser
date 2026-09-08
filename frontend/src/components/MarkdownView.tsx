// T3.4 (extended): markdown rendered server-side via pandoc (GFM), with
// mermaid diagrams and a dark/light toggle -- mirrors the pandoc pipeline
// in ~/myconf/dotfiles/vim/vimrc-functions.vim's PreviewMarkdown(), adapted
// to render inline (dangerouslySetInnerHTML) instead of a standalone file
// so links can be intercepted and routed through the app's own router
// instead of causing a real (404-prone) page navigation.
// Falls back to client-side react-markdown when pandoc isn't installed.

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { resolveRelativeLink } from '../lib/paths';
import { useMarkdownTheme } from '../lib/theme';

interface MarkdownViewProps {
  path: string;
  content: string;
  renderedHtml: string | null;
  onNavigate: (path: string) => void;
}

export function MarkdownView({ path, content, renderedHtml, onNavigate }: MarkdownViewProps) {
  const [theme, toggleTheme] = useMarkdownTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
      if (/^https?:/i.test(a.getAttribute('href') ?? '')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });

    // pandoc wraps a mermaid fence as <pre class="mermaid"><code>...</code></pre>;
    // mermaid only parses raw text in the <pre>, choking on the nested <code>
    // if left in place, and skips re-rendering once already processed -- so on
    // every pass (including a theme change) restore the original source text
    // and clear its processed marker before handing it back to mermaid.
    const diagrams = container.querySelectorAll<HTMLElement>('pre.mermaid');
    if (diagrams.length > 0) {
      diagrams.forEach((pre) => {
        if (pre.dataset.mermaidSource === undefined) {
          pre.dataset.mermaidSource = pre.textContent ?? '';
        }
        pre.removeAttribute('data-processed');
        pre.textContent = pre.dataset.mermaidSource;
      });
      mermaid.initialize({ startOnLoad: false, theme: theme === 'light' ? 'default' : 'dark' });
      mermaid.run({ nodes: Array.from(diagrams) }).catch(() => {});
    }
  }, [renderedHtml, theme]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const href = (e.target as HTMLElement).closest('a')?.getAttribute('href');
    if (!href) return;
    const resolved = resolveRelativeLink(path, href);
    if (resolved !== null) {
      e.preventDefault();
      onNavigate(resolved);
    }
  }

  if (renderedHtml) {
    return (
      <div className={`markdown-view${theme === 'light' ? ' theme-light' : ''}`}>
        <button className="markdown-theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div
          ref={containerRef}
          className="markdown-body"
          onClick={handleClick}
          // pandoc's own output -- server-rendered from the file's own content, not user input from the network
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    );
  }

  // pandoc unavailable server-side -- fall back to client rendering (no mermaid/theme)
  return (
    <div className="markdown-view" onClick={handleClick}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
