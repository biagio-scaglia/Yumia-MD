#!/usr/bin/env node
import { runCli } from './cli.js';

const result = runCli(process.argv);
if (result.output) {
  if (result.exitCode === 0) {
    console.log(result.output);
  } else {
    console.error(result.output);
  }
}
process.exit(result.exitCode);
