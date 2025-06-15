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
          message: 'Claim native (true) or wrapped (false) tokens from target chain?',
          default: true, // true = native, false = wrapped
        },
      ]);

      const signer = getSigner();

      const wrappedTokenSelected = config.tokens[tokenSelected].wrapped[target];
      if (!wrappedTokenSelected) {
        throw new Error('No wrapped token for the chosen token and network');
      }

      if (answer.claimNative) {
        await relayer.claim(signer, tokenSelected, wrappedTokenSelected);
      } else {
        await relayer.claimWrapped(signer, tokenSelected, wrappedTokenSelected);
      }

      console.log('Tokens claimed!');
    });
}
