export { OptimizerEngine } from './engine.js';
export { FormatRegistry, createDefaultRegistry } from './registry.js';
export { PngOptimizer } from './plugins/png.js';
export { JpgOptimizer } from './plugins/jpg.js';
export type {
  ImageFormatPlugin,
  OptimizeResult,
  OptimizeOptions,
  AuditEntry,
  AuditOptions,
  BatchResult,
} from './types.js';

import { createDefaultRegistry } from './registry.js';
import { OptimizerEngine } from './engine.js';
import type { BatchResult, AuditEntry, OptimizeOptions } from './types.js';

export async function optimize(
  inputPath: string,
  options: OptimizeOptions = {},
  format?: string,
): Promise<BatchResult> {
  const registry = createDefaultRegistry();
  const engine = new OptimizerEngine(registry, options);
  const files = await engine.resolveFiles(inputPath, format);

  if (files.length === 0) {
    const label = format ?? 'supported';
    throw new Error(`No ${label} files found at "${inputPath}"`);
  }

  return engine.optimizeFiles(files, format);
}

export async function audit(
  inputPath: string,
  threshold: number,
  options: OptimizeOptions = {},
  format?: string,
): Promise<AuditEntry[]> {
  const registry = createDefaultRegistry();
  const engine = new OptimizerEngine(registry, options);
  const files = await engine.resolveFiles(inputPath, format);

  if (files.length === 0) {
    const label = format ?? 'supported';
    throw new Error(`No ${label} files found at "${inputPath}"`);
  }

  return engine.audit(files, threshold, format);
}
