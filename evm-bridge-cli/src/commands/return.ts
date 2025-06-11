import { Command } from 'commander';

export default function returnCommand(): Command {
  return new Command('return')
    .description('Bridge wrapped tokens back to origin')
    .action(() => {
      console.log('Tokens returned!');
    });
}
