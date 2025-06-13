import { Command } from 'commander';
import inquirer from 'inquirer';
import { loadConfig, storeConfig } from '../config';
import Relayer from '../relayer';
import { getSigner } from '../wallet';

export default function selectTokenCommand(): Command {
  return new Command('select-token')
    .description('Select a token by address or auto-detect from wallet')
    .action(async () => {
      const config = await loadConfig();
      const tokenNames = Object.keys(config.tokens).filter(tokenName => config.current === config.tokens[tokenName].chain);

      const relayer = new Relayer(config.current);
      await relayer.init();

      const walletAddress = await getSigner().getAddress();

      // fill balances
      const tokenBalances = [];
      for (const tokenName of tokenNames) {
        const token = config.tokens[tokenName];
        const tokenBalance = await relayer.getTokenBalance(token.address, walletAddress);

        tokenBalances.push({
          ...token,
          balance: tokenBalance
        })
      }

      const tokensWithBalances = tokenBalances.filter(token => token.balance > 0);
      if (tokensWithBalances.length === 0) {
        console.log('No tokens with enough balance in your wallet to select from');
        return;
      }

      let selected;
      if (tokensWithBalances.length === 1) {
        // auto-select if only one have balance
        selected = tokensWithBalances[0];
      } else {
        // user needs to choose
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'symbol',
            message: 'Choose a token:',
            choices: tokensWithBalances.map(t => t.symbol),
          },
        ]);

        selected = tokensWithBalances.find(t => t.symbol === answer.symbol)!;
      }

      config.tokenSelected = selected.symbol;
      await storeConfig(config);

      console.log(`Selected ${selected.symbol} (${selected.address}); Balance: ${selected.balance}`);
    });
}
