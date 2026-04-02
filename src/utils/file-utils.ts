import { stat, mkdir, cp, rm } from 'node:fs/promises';
import { globby } from 'globby';

export async function findFiles(
  dir: string,
  extensions: string[],
  ignore?: string[],
): Promise<string[]> {
  const patterns = extensions.map(
    (ext) => `${dir}/**/*${ext}`,
  );
  return globby(patterns, { absolute: true, ignore });
}

export async function findSingleFile(filePath: string): Promise<string[]> {
  return [filePath];
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}

export async function getTotalSize(files: string[]): Promise<number> {
  const sizes = await Promise.all(files.map(getFileSize));
  return sizes.reduce((sum, s) => sum + s, 0);
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function copyDir(src: string, dest: string): Promise<void> {
  await cp(src, dest, { recursive: true, force: true });
}

export async function removeDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
