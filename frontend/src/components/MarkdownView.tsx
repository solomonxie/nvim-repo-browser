// T3.4: markdown rendered entirely client-side (react-markdown + remark-gfm)
// -- tables, task lists, strikethrough, autolinks. Fenced code blocks get
// highlight.js syntax highlighting; a ```mermaid fence renders as a live
// diagram via the mermaid npm package. Relative links are intercepted and
// routed through the app's own navigation instead of causing a real (and
// 404-prone, since a relative href resolves against the page's actual URL
// path -- always "/" under hash routing -- not the current hash) page
// navigation; external http(s) links open in a new tab.

import { useEffect, useRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { resolveRelativeLink } from '../lib/paths';
import { useTheme } from '../lib/theme';

function MermaidDiagram({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    mermaid.initialize({ startOnLoad: false, theme: theme === 'light' ? 'default' : 'dark' });
    mermaid
      .render(`mermaid-${Math.random().toString(36).slice(2)}`, source)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch((err) => {
        if (!cancelled && ref.current) ref.current.textContent = `Mermaid error: ${String(err)}`;
      });
    return () => {
      cancelled = true;
    };
  }, [source, theme]);

  return <div className="mermaid-diagram" ref={ref} />;
}

function HighlightedFence({ lang, content }: { lang: string; content: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.className = hljs.getLanguage(lang) ? `language-${lang}` : '';
    ref.current.removeAttribute('data-highlighted');
    hljs.highlightElement(ref.current);
  }, [lang, content]);

  return <code ref={ref}>{content}</code>;
}

interface MarkdownViewProps {
  path: string;
  content: string;
  onNavigate: (path: string) => void;
}

export function MarkdownView({ path, content, onNavigate }: MarkdownViewProps) {
  const components: Components = {
    a({ href, children, ...props }) {
      const resolved = href ? resolveRelativeLink(path, href) : null;
      if (resolved !== null) {
        return (
          <a
            {...props}
            href={href}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(resolved);
            }}
          >
            {children}
          </a>
        );
      }
      const external = href && /^https?:/i.test(href);
      return (
        <a {...props} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
          {children}
        </a>
      );
    },
    code({ className, children }) {
      const lang = /language-(\w+)/.exec(className ?? '')?.[1];
      const text = String(children).replace(/\n$/, '');
      if (lang === 'mermaid') return <MermaidDiagram source={text} />;
      if (!lang) return <code>{children}</code>;
      return <HighlightedFence lang={lang} content={text} />;
    },
  };

  return (
    <div className="markdown-view">
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
