#!/usr/bin/env node

import { run } from '@oclif/core';

run(void 0, import.meta.url)
  .then(require('@oclif/core/flush'))
  .catch(require('@oclif/core/handle'));
