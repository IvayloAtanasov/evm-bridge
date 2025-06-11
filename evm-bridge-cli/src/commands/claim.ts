import { Command } from 'commander';

export default function claimCommand(): Command {
  return new Command('claim')
    .description('Claim tokens on target chain')
    .action(() => {
      console.log('Tokens claimed!');
    });
}
