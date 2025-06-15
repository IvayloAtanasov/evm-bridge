import fs from 'fs/promises';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { loadConfig } from './config';
import erc20Abi from './abi/erc20.json';
import bridgeFactoryApi from './abi/bridgeFactory.json';

export class Relayer {
  private isInitialized = false;
  private provider: JsonRpcProvider | undefined;
  private bridge: ethers.Contract | undefined;
  private signer: Wallet | undefined;
  private chainId: number = 0;

  private historyStoragePath = `${__dirname}/storage/history.json`;

  constructor(private chain: string) { }

  async init() {
    const config = await loadConfig();
    const chainConfig = config.chains[this.chain];

    this.provider = new ethers.JsonRpcProvider(process.env[chainConfig.rpcEnvKey]);
    // Note: relayer signer is the wallet we're testing with for simplicity
    // in a real scenario tx sent from here would be from a dedicated relayer account
    this.signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY || '', this.provider);

    this.bridge = new ethers.Contract(chainConfig.bridgeFactory, bridgeFactoryApi, this.signer);

    this.chainId = chainConfig.chainId;

    this.isInitialized = true;
  }

  private assertInitialized() {
    if (!this.isInitialized || !this.provider || !this.signer || !this.bridge) {
      throw new Error('Relayer needs to be initialised first');
    }
  }

  private parseEvent(receipt: any, eventName: string) {
    const iface = new ethers.Interface([
      'event Locked(address indexed sender, address indexed user, address indexed token, uint256 amount, uint256 targetChainId)',
      'event Unlocked(address indexed sender, address indexed user, address indexed token, uint256 amount, uint256 targetChainId)'
    ]);

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === eventName) {
          return parsed.args;
        }
      } catch (err) {
        // another event, ignore
      }
    }

    throw new Error('Event not found in transaction');
  }

  private async storeHistory(history: any) {
    const historyStr = JSON.stringify(history, null, 2);

    await fs.writeFile(this.historyStoragePath, historyStr, { encoding: 'utf-8' });
  }

  private async storeHistoryEvent(
    bridge: string,
    event: string,
    user: string,
    token: string,
    amount: bigint,
    targetChainId: number
  ) {
    const history = await this.getHistory();
    history.push({
      date: new Date().toISOString(),
      bridge,
      event,
      user,
      token,
      amount,
      targetChainId,
      claimed: false
    });

    await this.storeHistory(history);
  }

  async getHistory() {
    const configStr = await fs.readFile(this.historyStoragePath, { encoding: 'utf-8' });

    return JSON.parse(configStr);
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string) {
    this.assertInitialized();

    const abi = ['function balanceOf(address owner) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, abi, this.provider);
    const balance = await contract.balanceOf(walletAddress);

    return balance;
  }

  async lockWithPermit(
    tokenAddress: string,
    signer: ethers.Wallet,
    amount: bigint,
    targetChainId: number
  ) {
    this.assertInitialized();

    const walletAddress = await signer.getAddress();
    const bridgeAddress = await this.bridge!.getAddress();
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);

    const nonce = await tokenContract.nonces(walletAddress);
    const name = await tokenContract.name();

    const domain = {
      name,
      version: '1',
      chainId: this.chainId,
      verifyingContract: tokenAddress,
    };

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const values = {
      owner: walletAddress,
      spender: bridgeAddress,
      value: amount,
      nonce,
      deadline,
    };

    const sig = await signer.signTypedData(domain, types, values);
    const { v, r, s } = ethers.Signature.from(sig);

    const tx = await this.bridge!.lockWithPermit(
      walletAddress,
      tokenAddress,
      amount,
      targetChainId,
      deadline,
      v, r, s
    );

    console.log('Lock transaction hash:', tx.hash);
    const receipt = await tx.wait();

    const lockedArgs = this.parseEvent(receipt, 'Locked');

    await this.storeHistoryEvent(
      bridgeAddress,
      'Locked',
      lockedArgs[1], // user
      lockedArgs[2], // token
      lockedArgs[3], // amount
      lockedArgs[4]  // target chain id
    );

    console.log('Stored Lock event');
  }

  async claimWrapped(signer: ethers.Wallet, token: string, wrappedToken: string) {
    this.assertInitialized();

    const walletAddress = await signer.getAddress();

    const history = await this.getHistory();
    const event = history.find(
      (e: any) => (
        e.event === 'Locked' &&
        e.token === token &&
        e.user === walletAddress &&
        e.targetChainId === this.chainId &&
        e.claimed === false
      )
    );
    if (!event) {
      throw new Error('Locked tokens not found');
    }

    await this.bridge!.claimWrapped(walletAddress, wrappedToken, event.amount);

    event.claimed = true;
    await this.storeHistory(history);
  }

  async unwrap(
    tokenAddress: string,
    amount: bigint,
    targetChainId: number
  ) {
    this.assertInitialized();

    const bridgeAddress = await this.bridge!.getAddress();

    const tx = await this.bridge!.unwrap(tokenAddress, amount, targetChainId);
    const receipt = await tx.wait();

    const eventArgs = this.parseEvent(receipt, 'Unlocked');

    await this.storeHistoryEvent(
      bridgeAddress,
      'Unlocked',
      eventArgs[1], // user
      eventArgs[2], // token
      eventArgs[3], // amount
      eventArgs[4]  // target chain id
    );

    console.log('Stored Unlocked event');
  }

  async claim(signer: ethers.Wallet, token: string, wrappedToken: string) {
    this.assertInitialized();

    const walletAddress = await signer.getAddress();

    const history = await this.getHistory();
    const event = history.find(
      (e: any) => (
        e.event === 'Unlocked' &&
        e.token === wrappedToken &&
        e.user === walletAddress &&
        e.targetChainId === this.chainId &&
        e.claimed === false
      )
    );
    if (!event) {
      throw new Error('Unlocked tokens not found');
    }

    await this.bridge!.claim(walletAddress, token, event.amount);

    event.claimed = true;
    await this.storeHistory(history);
  }
}

export default Relayer;
