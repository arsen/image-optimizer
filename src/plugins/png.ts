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
    const pngOpts: sharp.PngOptions = options?.lossless
      ? { palette: false, effort: 7 }
      : { quality: options?.quality ?? 80, effort: 7 };

    await sharp(src)
      .png(pngOpts)
      .toFile(dest);
  }
}
