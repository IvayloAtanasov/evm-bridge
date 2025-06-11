import { Command } from 'commander';

export default function switchNetworkCommand(): Command {
  return new Command('switch-network')
    .description('Change network used by the CLI tool')
    .action(() => {
      console.log('Network switched!');
    });
}
