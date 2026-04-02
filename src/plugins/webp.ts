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
    const webpOpts: sharp.WebpOptions = options?.lossless
      ? { lossless: true, effort: 6 }
      : { quality: options?.quality ?? 80, effort: 6 };

    await sharp(src)
      .webp(webpOpts)
      .toFile(dest);
  }
}
