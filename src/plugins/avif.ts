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
    const avifOpts: sharp.AvifOptions = options?.lossless
      ? { lossless: true, effort: 6 }
      : { quality: options?.quality ?? 50, effort: 6 };

    await sharp(src)
      .avif(avifOpts)
      .toFile(dest);
  }
}
