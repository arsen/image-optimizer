# image-optimize

Image compression utility. Supports PNG, JPEG, WebP, and AVIF out of the box, with a plugin architecture for adding new formats.

## Requirements

Node.js >= 18

## Installation

```bash
npm install -g image-optimize
```

## CLI Usage

```
image-optimize <path> [options]
```

**Arguments:**
- `path` — file or directory to optimize

**Options:**
| Flag | Description |
|------|-------------|
| `-t, --type <format>` | Image format (`png`, `jpg`, `webp`, `avif`). Omit to process all supported types. Ignored for single files (derived from extension). |
| `-a, --audit <threshold>` | Audit mode: list files exceeding the savings threshold (%) |
| `-q, --quality <n>` | Compression quality 1–100 (default: 80) |
| `-l, --lossless` | Lossless compression (JPEG files will be skipped) |
| `-s, --silent` | Suppress per-file output |
| `-f, --force` | Overwrite originals without confirmation |
| `-c, --concurrency <n>` | Max parallel tasks (default: CPU cores) |
| `-i, --ignore <pattern...>` | Glob patterns to exclude from processing |

### Examples

Optimize all supported images in a directory:

```bash
image-optimize ./images/ -f
```

Optimize only PNGs in a directory:

```bash
image-optimize ./images/ -t png
```

Optimize a single file (type derived from extension):

```bash
image-optimize ./photo.jpg -q 90 -f
```

Optimize only WebP files in a directory:

```bash
image-optimize ./images/ -t webp
```

Optimize AVIF files with custom quality:

```bash
image-optimize ./images/ -t avif -q 60
```

Optimize with 4 parallel workers:

```bash
image-optimize ./images/ -c 4 -f
```

Lossless compression for PNG, WebP, and AVIF (JPEG files skipped):

```bash
image-optimize ./images/ --lossless -f
```

Ignore specific folders or patterns:

```bash
image-optimize ./assets/ --ignore "vendor/*" "temp/*"
```

Audit PNGs — show files that could save more than 10%:

```bash
image-optimize ./assets/ -t png --audit 10
```

## Programmatic API

```typescript
import { optimize, audit } from 'image-optimize';

// Optimize all supported images in a directory
const result = await optimize('./images', { quality: 85, concurrency: 4 });

// Lossless compression (JPEG files are skipped)
const losslessResult = await optimize('./images', { lossless: true });
console.log(`Saved ${result.totalSavingsPercent}%`);

// Optimize only PNGs
const pngResult = await optimize('./images', { quality: 85 }, 'png');

// Ignore specific folders
const filtered = await optimize('./images', { ignore: ['vendor/*', 'temp/*'] });

// Audit JPEGs — dry run, no files modified
const entries = await audit('./photos', 10, {}, 'jpg');
for (const entry of entries.filter(e => e.aboveThreshold)) {
  console.log(`${entry.src}: ${entry.savingsPercent}%`);
}
```

## Custom Format Plugins

Add support for new formats by implementing `ImageFormatPlugin`:

```typescript
import { FormatRegistry, createDefaultRegistry } from 'image-optimize';
import type { ImageFormatPlugin, OptimizeOptions } from 'image-optimize';

class TiffOptimizer implements ImageFormatPlugin {
  name = 'tiff';
  extensions = ['.tiff', '.tif'];

  async optimize(src: string, dest: string, options?: OptimizeOptions) {
    // your implementation
  }
}

const registry = createDefaultRegistry();
registry.register(new TiffOptimizer());
```

## Development

```bash
npm install
npm run build       # compiles TypeScript to dist/
npm run clean       # removes dist/
```

## License

ISC
