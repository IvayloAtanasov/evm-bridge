import { Command } from 'commander';
import inquirer from 'inquirer';
import { loadConfig, storeConfig } from '../config';

export default function selectTargetChainCommand(): Command {
  return new Command('select-target-chain')
    .description('Choose the target chain (exclude current)')
    .action(async () => {
      const config = await loadConfig();

      const currentChain = config.current;
      const choices = Object.keys(config.chains).filter(ch => ch !== currentChain);

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'chain',
          message: 'Choose a network:',
          choices: choices,
        },
      ]);

      config.target = answer.chain;
      await storeConfig(config);

      console.log(`Target network switched to ${answer.chain}.`);
    });
}
