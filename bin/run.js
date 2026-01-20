#!/usr/bin/env node

import { run, flush, handle } from '@oclif/core';

run(void 0, import.meta.url)
  .then(flush)
  .catch(handle);
