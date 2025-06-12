import { ethers, JsonRpcProvider } from 'ethers';
import { loadConfig } from './config';

export class Relayer {
  private provider: JsonRpcProvider | undefined;

  constructor(private chain: string) { }

  async init() {
    const config = await loadConfig();
    const rpcKey = config.chains[this.chain].rpcEnvKey;

    this.provider = new ethers.JsonRpcProvider(process.env[rpcKey]);
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string) {
    const abi = ['function balanceOf(address owner) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, abi, this.provider);
    const balance = await contract.balanceOf(walletAddress);

    return balance;
  }
}

export default Relayer;
