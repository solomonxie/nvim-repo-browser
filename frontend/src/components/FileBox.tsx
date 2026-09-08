// GitHub's bordered file-view card: Preview/Code/Blame mode tabs (Preview
// only for markdown) -- wraps whatever the caller renders for Preview/
// Code via a render prop, since that content (MarkdownView vs CodeView)
// is already decided by ContentPane based on the file's extension.

import { useState, type ReactNode } from 'react';
import { BlameView } from './BlameView';

export type FileMode = 'preview' | 'code' | 'blame';

interface FileBoxProps {
  path: string;
  showPreview: boolean;
  children: (mode: 'preview' | 'code') => ReactNode;
}

export function FileBox({ path, showPreview, children }: FileBoxProps) {
  const [mode, setMode] = useState<FileMode>(showPreview ? 'preview' : 'code');

  return (
    <div className="file-box">
      <div className="file-box-header">
        <div className="file-box-tabs">
          {showPreview && (
            <button className={`file-box-tab${mode === 'preview' ? ' active' : ''}`} onClick={() => setMode('preview')}>
              Preview
            </button>
          )}
          <button className={`file-box-tab${mode === 'code' ? ' active' : ''}`} onClick={() => setMode('code')}>
            Code
          </button>
          <button className={`file-box-tab${mode === 'blame' ? ' active' : ''}`} onClick={() => setMode('blame')}>
            Blame
          </button>
        </div>
      </div>
      <div className="file-box-body">{mode === 'blame' ? <BlameView path={path} /> : children(mode)}</div>
    </div>
  );
}
