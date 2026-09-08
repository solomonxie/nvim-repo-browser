// T2.1: classify a file as text/image/binary/too-large.

import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import type { FileContent } from '../shared/types';
import { renderMarkdown } from './pandoc';

const MAX_TEXT_BYTES = 1_000_000; // 1MB
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico']);

export function isImage(ext: string): boolean {
  return IMAGE_EXTS.has(ext);
}

function isBinary(buf: Buffer): boolean {
  const len = Math.min(buf.length, 8000);
  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

export function classifyFile(absPath: string, relPath: string, size: number): FileContent {
  const ext = extname(absPath).toLowerCase();

  if (size > MAX_TEXT_BYTES) {
    return { path: relPath, ext, size, binary: false, tooLarge: true, content: null, renderedHtml: null };
  }

  if (isImage(ext)) {
    // content served separately via /raw/<path>, not inlined here
    return { path: relPath, ext, size, binary: false, tooLarge: false, content: null, renderedHtml: null };
  }

  const buf = readFileSync(absPath);
  if (isBinary(buf)) {
    return { path: relPath, ext, size, binary: true, tooLarge: false, content: null, renderedHtml: null };
  }

  const content = buf.toString('utf-8');
  const renderedHtml = ext === '.md' ? renderMarkdown(absPath) : null;
  return { path: relPath, ext, size, binary: false, tooLarge: false, content, renderedHtml };
}
