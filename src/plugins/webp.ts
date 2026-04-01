import sharp from 'sharp';
import type { ImageFormatPlugin, OptimizeOptions } from '../types.js';

export class WebpOptimizer implements ImageFormatPlugin {
  readonly name = 'webp';
  readonly extensions = ['.webp'];

  async optimize(
    src: string,
    dest: string,
    options?: OptimizeOptions,
  ): Promise<void> {
    const quality = options?.quality ?? 80;

    await sharp(src)
      .webp({ quality, effort: 6 })
      .toFile(dest);
  }
}
