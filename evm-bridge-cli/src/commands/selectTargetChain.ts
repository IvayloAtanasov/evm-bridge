import { Command } from 'commander';

export default function selectTargetChainCommand(): Command {
  return new Command('select-target-chain')
    .description('Choose the target chain (exclude current)')
    .action(() => {
      console.log('Target chain chosen!');
    });
}
