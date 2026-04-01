import type { ImageFormatPlugin } from './types.js';
import { PngOptimizer } from './plugins/png.js';
import { JpgOptimizer } from './plugins/jpg.js';
import { WebpOptimizer } from './plugins/webp.js';
import { AvifOptimizer } from './plugins/avif.js';

export class FormatRegistry {
  private plugins = new Map<string, ImageFormatPlugin>();

  register(plugin: ImageFormatPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(format: string): ImageFormatPlugin | undefined {
    return this.plugins.get(format);
  }

  getSupportedFormats(): string[] {
    return [...this.plugins.keys()];
  }

  getExtensions(format: string): string[] {
    return this.plugins.get(format)?.extensions ?? [];
  }

  getAllExtensions(): string[] {
    return [...this.plugins.values()].flatMap((p) => p.extensions);
  }

  getPluginByExtension(ext: string): ImageFormatPlugin | undefined {
    const normalized = ext.startsWith('.') ? ext : `.${ext}`;
    return [...this.plugins.values()].find((p) =>
      p.extensions.includes(normalized.toLowerCase()),
    );
  }
}

export function createDefaultRegistry(): FormatRegistry {
  const registry = new FormatRegistry();
  registry.register(new PngOptimizer());
  registry.register(new JpgOptimizer());
  registry.register(new WebpOptimizer());
  registry.register(new AvifOptimizer());
  return registry;
}
