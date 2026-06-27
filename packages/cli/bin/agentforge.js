#!/usr/bin/env node
/* global console, process */

import('../dist/index.js')
  .then((module) => module.run())
  .catch((error) => {
    console.error('Error running AgentForge CLI:', error);
    process.exit(1);
  });
