import { Command } from 'commander';
import { createDefaultRegistry } from './registry.js';
import { OptimizerEngine } from './engine.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function createCli(): Command {
  const program = new Command();
  const registry = createDefaultRegistry();
  const formats = registry.getSupportedFormats();

  program
    .name('image-optimize')
    .description('Image compression utility')
    .version('2.1.0')
    .argument('[path]', 'file or directory path')
    .option('-t, --type <format>', `image format (${formats.join(', ')}); omit to process all supported types`)
    .option('-a, --audit <threshold>', 'audit mode: list files above savings threshold (%)', parseInt)
    .option('-q, --quality <n>', 'compression quality 1-100 (default: 80)', parseInt)
    .option('-l, --lossless', 'lossless compression (JPEG files will be skipped)')
    .option('-s, --silent', 'suppress per-file output')
    .option('-f, --force', 'overwrite originals without confirmation')
    .option('-c, --concurrency <n>', 'max parallel tasks (default: CPU cores)', parseInt)
    .action(async (inputPath: string | undefined, opts) => {
      if (!inputPath) {
        program.help();
        return;
      }

      const format: string | undefined = opts.type;

      if (format && !formats.includes(format)) {
        console.error(
          `Unknown format "${format}". Supported: ${formats.join(', ')}`,
        );
        process.exitCode = 1;
        return;
      }

      const engine = new OptimizerEngine(registry, {
        quality: opts.quality,
        lossless: opts.lossless,
        silent: opts.silent,
        force: opts.force,
        concurrency: opts.concurrency,
      });

      let files: string[];
      try {
        files = await engine.resolveFiles(inputPath, format);
      } catch {
        console.error(`Invalid path: ${inputPath}`);
        process.exitCode = 1;
        return;
      }

      if (files.length === 0) {
        const label = format ?? 'supported';
        console.log(`No ${label} files found at "${inputPath}".`);
        return;
      }

      if (!opts.silent) {
        console.log(`Found ${files.length} file(s)\n`);
      }

      if (opts.audit != null) {
        const entries = await engine.audit(files, opts.audit, format);
        const flagged = entries.filter((e) => e.aboveThreshold);

        if (flagged.length === 0) {
          console.log(`No files exceed ${opts.audit}% savings threshold.`);
          return;
        }

        console.log(
          `${flagged.length} file(s) above ${opts.audit}% threshold:\n`,
        );
        for (const entry of flagged) {
          const rel = entry.src.replace(process.cwd() + '/', '');
          console.log(
            `  ${rel}  ${formatBytes(entry.srcSize)} → ${formatBytes(entry.destSize)}  (${entry.savingsPercent}%)`,
          );
        }
        return;
      }

      const result = await engine.optimizeFiles(files, format);

      console.log('\n--- Optimization Summary ---');
      console.log(`  Files:    ${result.files.length}`);
      console.log(`  Before:   ${formatBytes(result.totalSrcSize)}`);
      console.log(`  After:    ${formatBytes(result.totalDestSize)}`);
      console.log(
        `  Saved:    ${formatBytes(result.totalSavings)} (${result.totalSavingsPercent}%)`,
      );

      if (opts.force) {
        await engine.replaceOriginals();
        console.log('\nFiles replaced successfully.');
        return;
      }

      const readline = await import('node:readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('\nReplace original files? [y/N] ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'y') {
        await engine.replaceOriginals();
        console.log('Files replaced successfully.');
      } else {
        await engine.cleanup();
        console.log('Aborted. Originals unchanged.');
      }
    });

  return program;
}
