// T3.4: syntax-highlighted code via highlight.js's full language bundle
// (every language it ships, vim included -- no manual registration
// needed) run through hljs.highlightElement in a useEffect. A
// filename/extension -> language lookup covers extensionless dotfiles
// hljs's own auto-detection tends to get wrong (.zshrc, .vimrc, etc.).

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';

const EXT_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.json': 'json',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.css': 'css',
  '.html': 'xml',
  '.lua': 'lua',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.java': 'java',
  '.sql': 'sql',
  '.toml': 'ini',
  '.ini': 'ini',
  '.vim': 'vim',
  '.diff': 'diff',
};

const FILENAME_LANG: Record<string, string> = {
  '.zshrc': 'bash',
  '.bashrc': 'bash',
  '.bash_profile': 'bash',
  '.profile': 'bash',
  '.vimrc': 'vim',
  '.gvimrc': 'vim',
  '.gitconfig': 'ini',
  '.gitignore': 'ini',
  '.npmrc': 'ini',
  '.editorconfig': 'ini',
  dockerfile: 'dockerfile',
  makefile: 'makefile',
};

function detectLanguage(path: string, ext: string): string | undefined {
  const name = (path.split('/').pop() ?? '').toLowerCase();
  return FILENAME_LANG[name] ?? EXT_LANG[ext];
}

interface CodeViewProps {
  path: string;
  ext: string;
  content: string;
}

export function CodeView({ path, ext, content }: CodeViewProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const lang = detectLanguage(path, ext);
    ref.current.className = lang && hljs.getLanguage(lang) ? `language-${lang}` : '';
    ref.current.removeAttribute('data-highlighted');
    hljs.highlightElement(ref.current);
  }, [path, ext, content]);

  return (
    <pre className="code-view">
      {/* key forces a fresh DOM node per file -- hljs mutates this node's
          innerHTML directly, which would otherwise fight React's own
          reconciliation of the {content} text child on file switch. */}
      <code ref={ref} key={path}>
        {content}
      </code>
    </pre>
  );
}
