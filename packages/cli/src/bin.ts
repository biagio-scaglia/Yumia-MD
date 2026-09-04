#!/usr/bin/env node
import { runCli } from './cli.js';

const result = await runCli(process.argv);
if (result.output) {
  if (result.exitCode === 0) {
    console.log(result.output);
  } else {
    console.error(result.output);
  }
}
if (!result.keepAlive) {
  process.exit(result.exitCode);
}
