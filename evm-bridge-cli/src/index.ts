#!/usr/bin/env node

import { Command } from 'commander';
const program = new Command();

program
  .name('evm-bridge')
  .description('EVM Bridge CLI')
  .version('0.1.0');

program.parse();
