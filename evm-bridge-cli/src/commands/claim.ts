import { Command } from 'commander';
import inquirer from 'inquirer';
import { loadConfig } from '../config';
import Relayer from '../relayer';
import { getSigner } from '../wallet';

export default function claimCommand(): Command {
  return new Command('claim')
    .description('Claim tokens on target chain')
    .action(async () => {
      const config = await loadConfig();
      const { tokenSelected, target } = config;

      const relayer = new Relayer(target);
      await relayer.init();

      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'claimNative',
          message: 'Claim native (yes) or wrapped (no) tokens from target chain?',
          default: true, // true = native, false = wrapped
        },
      ]);

      const signer = getSigner();

      // TODO: better interface as now claim native can really be reached
      const tokenAddress = config.tokens[tokenSelected].address;
      const wrappedTokenAddress = config.tokens[tokenSelected].wrapped[target];
      if (!wrappedTokenAddress) {
        throw new Error('No wrapped token for the chosen token and network');
      }

      if (answer.claimNative) {
        await relayer.claim(signer, tokenAddress, wrappedTokenAddress);
      } else {
        await relayer.claimWrapped(signer, tokenAddress, wrappedTokenAddress);
      }

      console.log('Tokens claimed!');
    });
}
