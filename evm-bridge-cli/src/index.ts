#!/usr/bin/env node

import { Command } from 'commander';
import claimCommand from './commands/claim';
import historyCommand from './commands/history';
import lockCommand from './commands/lock';
import returnCommand from './commands/return';
import selectTargetChainCommand from './commands/selectTargetChain';
import selectTokenCommand from './commands/selectToken';
import switchNetworkCommand from './commands/switchNetwork';

const program = new Command();

program
  .name('evm-bridge')
  .description('EVM Bridge CLI')
  .version('0.1.0');

program.addCommand(selectTokenCommand());
program.addCommand(selectTargetChainCommand());
program.addCommand(lockCommand());
program.addCommand(claimCommand());
program.addCommand(returnCommand());
program.addCommand(historyCommand());
program.addCommand(switchNetworkCommand());

program.parse();
