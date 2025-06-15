import { Command } from 'commander';
import { loadConfig } from '../config';
import Relayer from '../relayer';

export default function historyCommand(): Command {
  return new Command('history')
    .description('Show transaction history')
    .action(async () => {
      const config = await loadConfig();

      const relayer = new Relayer(config.current);
      await relayer.init();

      const history = await relayer.getHistory();

      console.table(history);
    });
}
