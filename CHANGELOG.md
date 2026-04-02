# Changelog

## 2.1.0

### Added

- **`--lossless` / `-l` flag** — enables lossless compression for PNG, WebP, and AVIF. When set, `quality` is ignored and format-native lossless modes are used instead.
- **JPEG lossless skip** — JPEG files are skipped with a stderr warning when `--lossless` is set, since the format has no lossless mode. The original file is copied through unchanged so the pipeline reports 0% savings.
- **`lossless` option in programmatic API** — pass `{ lossless: true }` to `optimize()` or `audit()`.

## 2.0.0

Complete rewrite in TypeScript.

### Highlights

- **TypeScript** — entire codebase rewritten in TypeScript with full type definitions shipped in the package.
- **Plugin architecture** — new `ImageFormatPlugin` interface and `FormatRegistry` make it straightforward to add support for custom image formats without touching core code.
- **Built-in formats** — PNG, JPEG, WebP, and AVIF optimizers ship as first-party plugins, all powered by [sharp](https://sharp.pixelplumbing.com/).
- **Audit mode** — `--audit <threshold>` flag (and programmatic `audit()` API) for dry-run analysis that lists files exceeding a savings threshold.
- **Programmatic API** — `optimize()` and `audit()` can be imported and used directly from Node.js, with typed results (`BatchResult`, `AuditEntry`).
- **CLI overhaul** — rebuilt with [Commander](https://github.com/tj/commander.js) for cleaner argument parsing, format filtering (`--type`), quality control (`--quality`), verbose output, and force-overwrite support.
- **ESM-only** — published as a pure ES module (`"type": "module"`).
- **Node.js 18+** — minimum supported runtime raised to Node.js 18.
