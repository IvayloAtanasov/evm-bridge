import { Command } from 'commander';
import inquirer from 'inquirer';
import { loadConfig } from '../config';
import Relayer from '../relayer';
import { getSigner } from '../wallet';

export default function claimCommand(): Command {
  return new Command('claim')
    .description('Claim tokens on current chain or wrapped tokens on target chain')
    .action(async () => {
      const config = await loadConfig();
      const { tokenSelected, current, target } = config;

      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'claimNative',
          message: 'Claim native (yes) or wrapped (no) tokens from target chain?',
          default: true, // true = native, false = wrapped
        },
      ]);

      const signer = getSigner();

      const tokenAddress = config.tokens[tokenSelected].address;
      const wrappedTokenAddress = config.tokens[tokenSelected].wrapped[target];
      if (!wrappedTokenAddress) {
        throw new Error('No wrapped token for the chosen token and network');
      }

      if (answer.claimNative) {
        const relayer = new Relayer(current);
        await relayer.init();
        await relayer.claim(signer, tokenAddress, wrappedTokenAddress);
      } else {
        const relayer = new Relayer(target);
        await relayer.init();
        await relayer.claimWrapped(signer, tokenAddress, wrappedTokenAddress);
      }

      console.log('Tokens claimed!');
    });
}
