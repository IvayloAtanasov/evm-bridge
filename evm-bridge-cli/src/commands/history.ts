import { Command } from 'commander';
import { formatUnits } from 'ethers';
import { loadConfig } from '../config';
import Relayer from '../relayer';

function shortenAddress(address: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("Invalid Ethereum address");
  }
  return `${address.slice(0, 4 + 2)}...${address.slice(-4)}`;
}

export default function historyCommand(): Command {
  return new Command('history')
    .description('Show transaction history')
    .action(async () => {
      const config = await loadConfig();

      const relayer = new Relayer(config.current);
      await relayer.init();

      const history = await relayer.getHistory();

      console.table(
        history.map((h: any) => ({
          date: h.date,
          bridge: shortenAddress(h.bridge),
          event: h.event,
          user: shortenAddress(h.user),
          token: shortenAddress(h.token),
          amount: formatUnits(h.amount, 6),
          targetChainId: h.targetChainId
        }))
      );
    });
}
