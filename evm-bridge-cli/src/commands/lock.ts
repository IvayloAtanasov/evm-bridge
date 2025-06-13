import { Command } from 'commander';
import { ethers } from 'ethers';
import { loadConfig, storeConfig } from '../config';
import Relayer from '../relayer';
import { getSigner } from '../wallet';

export default function lockCommand(): Command {
  return new Command('lock')
    .description('Lock tokens via `permit` + bridge interaction')
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

      const relayer = new Relayer(config.current);
      await relayer.init();

      const signer = getSigner();

      const currentChain = config.chains[config.current];
      const bridgeAddress = currentChain.bridgeFactory;

      const amountWei = ethers.parseUnits(amount, 6);

      await relayer.lockWithPermit(
        token.address,
        signer,
        bridgeAddress,
        amountWei,
        targetChain.chainId
      );

      console.log('Tokens locked!');
    });
}
