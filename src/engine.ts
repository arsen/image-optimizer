import path from 'node:path';
import { stat, copyFile } from 'node:fs/promises';
import { FormatRegistry } from './registry.js';
import {
  findFiles,
  ensureDir,
  removeDir,
  getFileSize,
} from './utils/file-utils.js';
import type {
  OptimizeResult,
  BatchResult,
  AuditEntry,
  OptimizeOptions,
} from './types.js';

export class OptimizerEngine {
  private tmpDir: string;
  private lastResults: OptimizeResult[] = [];

  constructor(
    private registry: FormatRegistry,
    private options: OptimizeOptions = {},
  ) {
    this.tmpDir = path.resolve('.tmp-image-optimize');
  }

  async optimizeFiles(
    files: string[],
    format?: string,
  ): Promise<BatchResult> {
    await ensureDir(this.tmpDir);
    const results: OptimizeResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const src = files[i];
        const plugin = format
          ? this.registry.getPlugin(format)
          : this.registry.getPluginByExtension(path.extname(src));

        if (!plugin) {
          const ext = path.extname(src);
          throw new Error(
            `No plugin for "${format ?? ext}". Supported: ${this.registry.getSupportedFormats().join(', ')}`,
          );
        }

        const relative = path.relative(process.cwd(), src);
        const dest = path.join(this.tmpDir, relative);

        await ensureDir(path.dirname(dest));

        if (this.options.verbose) {
          process.stdout.write(`[${i + 1}/${files.length}] ${relative} ... `);
        }

        await plugin.optimize(src, dest, this.options);

        const srcSize = await getFileSize(src);
        const destSize = await getFileSize(dest);
        const savings = srcSize - destSize;
        const savingsPercent =
          srcSize > 0 ? Math.round((savings / srcSize) * 100) : 0;

        const result: OptimizeResult = {
          src,
          dest,
          srcSize,
          destSize,
          savings,
          savingsPercent: Math.max(0, savingsPercent),
        };
        results.push(result);

        if (this.options.verbose) {
          console.log(`done (${result.savingsPercent}%)`);
        }
      }
    } catch (err) {
      await this.cleanup();
      throw err;
    }

    this.lastResults = results;
    return this.summarize(results);
  }

  async audit(
    files: string[],
    threshold: number,
    format?: string,
  ): Promise<AuditEntry[]> {
    const batch = await this.optimizeFiles(files, format);
    const entries: AuditEntry[] = batch.files.map((r) => ({
      ...r,
      aboveThreshold: r.savingsPercent >= threshold,
    }));

    await this.cleanup();
    return entries;
  }

  async replaceOriginals(): Promise<void> {
    for (const result of this.lastResults) {
      await copyFile(result.dest, result.src);
    }
    await this.cleanup();
  }

  async cleanup(): Promise<void> {
    await removeDir(this.tmpDir);
  }

  async resolveFiles(
    inputPath: string,
    format?: string,
  ): Promise<string[]> {
    const resolved = path.resolve(inputPath);
    const stats = await stat(resolved);

    if (stats.isFile()) {
      return [resolved];
    }

    if (stats.isDirectory()) {
      const extensions = format
        ? this.registry.getExtensions(format)
        : this.registry.getAllExtensions();

      if (extensions.length === 0) {
        throw new Error(
          format
            ? `No extensions registered for format "${format}"`
            : 'No formats registered',
        );
      }
      return findFiles(resolved, extensions);
    }

    throw new Error(`Path is neither a file nor a directory: ${inputPath}`);
  }

  private summarize(files: OptimizeResult[]): BatchResult {
    const totalSrcSize = files.reduce((s, f) => s + f.srcSize, 0);
    const totalDestSize = files.reduce((s, f) => s + f.destSize, 0);
    const totalSavings = totalSrcSize - totalDestSize;
    const totalSavingsPercent =
      totalSrcSize > 0 ? Math.round((totalSavings / totalSrcSize) * 100) : 0;

    return {
      files,
      totalSrcSize,
      totalDestSize,
      totalSavings,
      totalSavingsPercent,
    };
  }
}
