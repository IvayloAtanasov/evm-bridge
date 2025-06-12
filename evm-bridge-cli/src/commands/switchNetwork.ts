import { Command } from 'commander';
import inquirer from 'inquirer';
import { loadConfig, storeConfig } from '../config';

export default function switchNetworkCommand(): Command {
  return new Command('switch-network')
    .description('Change network used by the CLI tool')
    .action(async () => {
      const config = await loadConfig();

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'chain',
          message: 'Choose a network:',
          choices: Object.keys(config.chains),
        },
      ]);

      config.current = answer.chain;
      config.target = '';
      config.tokenSelected = '';
      await storeConfig(config);

      console.log(`Network switched to ${answer.chain}. Target network resets.`);
    });
}
