# Changelog

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
