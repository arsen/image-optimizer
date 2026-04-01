#!/usr/bin/env node
import { createCli } from '../src/cli.js';

const program = createCli();
program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exitCode = 1;
});
