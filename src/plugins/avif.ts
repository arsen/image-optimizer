import sharp from 'sharp';
import type { ImageFormatPlugin, OptimizeOptions } from '../types.js';

export class AvifOptimizer implements ImageFormatPlugin {
  readonly name = 'avif';
  readonly extensions = ['.avif'];

  async optimize(
    src: string,
    dest: string,
    options?: OptimizeOptions,
  ): Promise<void> {
    const quality = options?.quality ?? 50;

    await sharp(src)
      .avif({ quality, effort: 6 })
      .toFile(dest);
  }
}
