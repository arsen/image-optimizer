import { copyFile } from 'node:fs/promises';
import sharp from 'sharp';
import type { ImageFormatPlugin, OptimizeOptions } from '../types.js';

export class JpgOptimizer implements ImageFormatPlugin {
  readonly name = 'jpg';
  readonly extensions = ['.jpg', '.jpeg'];

  async optimize(
    src: string,
    dest: string,
    options?: OptimizeOptions,
  ): Promise<void> {
    if (options?.lossless) {
      console.error(
        `JPEG does not support lossless compression, skipping: ${src}`,
      );
      await copyFile(src, dest);
      return;
    }

    const quality = options?.quality ?? 80;

    await sharp(src)
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toFile(dest);
  }
}
