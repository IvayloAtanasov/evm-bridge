import fs from 'fs/promises';

const CONFIG_PATH = `${__dirname}/bridge.config.json`;

interface ChainConfig {
  rpcEnvKey: string;
  bridgeFactory: string;
  chainId: number;
}

interface TokenConfig {
  chain: string;
  address: string;
  symbol: string;
  wrapped: {
    [chainName: string]: string;
  }
}

interface IConfig {
  current: string;
  target: string;
  tokenSelected: string;
  chains: {
    [chainName: string]: ChainConfig;
  },
  tokens: {
    [tokenName: string]: TokenConfig;
  }
}

export async function loadConfig(): Promise<IConfig> {
  const configStr = await fs.readFile(CONFIG_PATH, { encoding: 'utf-8' });

  return JSON.parse(configStr);
}

export async function storeConfig(config: IConfig) {
  const configStr = JSON.stringify(config, null, 2);

  await fs.writeFile(CONFIG_PATH, `${configStr}\n`, { encoding: 'utf-8' });
}
