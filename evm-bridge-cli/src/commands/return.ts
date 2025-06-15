import { Command } from 'commander';
import { ethers } from 'ethers';
import { loadConfig } from '../config';
import Relayer from '../relayer';

export default function returnCommand(): Command {
  return new Command('return')
    .description('Bridge wrapped tokens back to origin')
    .argument('<amount>', 'Amount to bridge (in tokens)')
    .action(async (amount) => {
      const config = await loadConfig();

      const token = config.tokens[config.tokenSelected];
      if (!token) {
        throw new Error('You need to select token to bridge before bridging');
      }
      const targetChain = config.chains[config.target];
      if (!targetChain) {
        throw new Error('You need to select target chain before bridging');
      }
      const wrappedTokenAddress = token.wrapped[config.target];

      const relayer = new Relayer(config.target);
      await relayer.init();

      const amountWei = ethers.parseUnits(amount, 6);

      await relayer.unwrap(
        wrappedTokenAddress,
        amountWei,
        config.chains[config.current].chainId
      );

      console.log('Tokens returned!');
    });
}
