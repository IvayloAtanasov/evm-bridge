import { Command } from 'commander';

export default function selectTokenCommand(): Command {
  return new Command('select-token')
    .description('Select a token by address or auto-detect from wallet')
    .action(() => {
      console.log('Token selected!');
    });
}
