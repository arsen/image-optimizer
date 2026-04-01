import path from 'node:path';
import os from 'node:os';
import { stat, copyFile } from 'node:fs/promises';
import { FormatRegistry } from './registry.js';
import {
  findFiles,
  ensureDir,
  removeDir,
  getFileSize,
} from './utils/file-utils.js';
import { pLimit } from './utils/concurrency.js';
import type {
  OptimizeResult,
  BatchResult,
  AuditEntry,
  OptimizeOptions,
} from './types.js';

function defaultConcurrency(): number {
  return typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
}

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

    const concurrency = this.options.concurrency ?? defaultConcurrency();
    const limit = pLimit(concurrency);
    let completed = 0;

    try {
      const results = await Promise.all(
        files.map((src) =>
          limit(async (): Promise<OptimizeResult> => {
            const plugin = format
              ? this.registry.getPlugin(format)
              : this.registry.getPluginByExtension(path.extname(src));

            if (!plugin) {
              const ext = path.extname(src);
              throw new Error(
                `No plugin for "${format ?? ext}". Supported: ${this.registry.getSupportedFormats().join(', ')}`,
              );
            }

            const relative = path.relative(process.cwd(), src)
              .split(path.sep)
              .filter((seg) => seg !== '..')
              .join(path.sep);
            const dest = path.join(this.tmpDir, relative);

            await ensureDir(path.dirname(dest));
            await plugin.optimize(src, dest, this.options);

            const srcSize = await getFileSize(src);
            const destSize = await getFileSize(dest);
            const savings = srcSize - destSize;
            const savingsPercent =
              srcSize > 0 ? Math.round((savings / srcSize) * 100) : 0;

            const seq = ++completed;
            if (this.options.verbose) {
              process.stdout.write(
                `[${seq}/${files.length}] ${relative} ... done (${Math.max(0, savingsPercent)}%)\n`,
              );
            }

            return {
              src,
              dest,
              srcSize,
              destSize,
              savings,
              savingsPercent: Math.max(0, savingsPercent),
            };
          }),
        ),
      );

      this.lastResults = results;
      return this.summarize(results);
    } catch (err) {
      await this.cleanup();
      throw err;
    }
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
    const concurrency = this.options.concurrency ?? defaultConcurrency();
    const limit = pLimit(concurrency);
    await Promise.all(
      this.lastResults.map((result) =>
        limit(() => copyFile(result.dest, result.src)),
      ),
    );
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
