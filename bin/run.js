#!/usr/bin/env node

// Suppress oclif MODULE_NOT_FOUND warnings
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.code !== 'MODULE_NOT_FOUND') {
    console.warn(warning.stack);
  }
});

import { run, flush, handle } from '@oclif/core';

run(process.argv.slice(2), import.meta.url)
  .then(flush)
  .catch(handle);
