import sharp from 'sharp';
import type { ImageFormatPlugin, OptimizeOptions } from '../types.js';

export class PngOptimizer implements ImageFormatPlugin {
  readonly name = 'png';
  readonly extensions = ['.png'];

  async optimize(
    src: string,
    dest: string,
    options?: OptimizeOptions,
  ): Promise<void> {
    const quality = options?.quality ?? 80;

    await sharp(src)
      .png({ quality, effort: 7 })
      .toFile(dest);
  }
}
