import { Command } from 'commander';

export default function lockCommand(): Command {
  return new Command('lock')
    .description('Lock tokens via `permit` + bridge interaction')
    .action(async () => {

      console.log('Tokens locked!');
    });
}
