import { Command } from 'commander';

export default function historyCommand(): Command {
  return new Command('history')
    .description('Show transaction history')
    .action(() => {
      console.log('History shown!');
    });
}
