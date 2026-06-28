import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

export async function ensureUploadDir(subdir: string = '') {
  const dir = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR;
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveFile(
  file: File,
  subdir: string = 'misc',
): Promise<{ filename: string; path: string; size: number; mimeType: string }> {
  const dir = await ensureUploadDir(subdir);
  const ext = path.extname(file.name) || '';
  const safeExt = ext.replace(/[^.\w]/g, '').slice(0, 8);
  const filename = `${randomBytes(8).toString('hex')}${Date.now()}${safeExt}`;
  const target = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(target, buffer);

  const relPath = path.relative(process.cwd(), target).replace(/\\/g, '/');
  return {
    filename,
    path: relPath,
    size: buffer.length,
    mimeType: file.type || 'application/octet-stream',
  };
}

export async function readFile(relPath: string): Promise<Buffer> {
  if (relPath.includes('..')) throw new Error('Invalid path');
  const absolute = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);
  return fs.readFile(absolute);
}

export async function deleteFile(relPath: string): Promise<void> {
  if (relPath.includes('..')) throw new Error('Invalid path');
  const absolute = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);
  try {
    await fs.unlink(absolute);
  } catch {
    // ignore if missing
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
