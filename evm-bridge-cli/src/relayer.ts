import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { loadConfig } from './config';
import erc20Abi from './abi/erc20.json';

export class Relayer {
  private isInitialized = false;
  private provider: JsonRpcProvider | undefined;
  private signer: Wallet | undefined;

  constructor(private chain: string) { }

  async init() {
    const config = await loadConfig();
    const rpcKey = config.chains[this.chain].rpcEnvKey;

    this.provider = new ethers.JsonRpcProvider(process.env[rpcKey]);
    // Note: relayer signer is the wallet we're testing with for simplicity
    // in a real scenario tx sent from here would be from a dedicated relayer account
    this.signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY || '', this.provider);

    this.isInitialized = true;
  }

  private assertInitialized() {
    if (!this.isInitialized || !this.provider || !this.signer) {
      throw new Error('Relayer needs to be initialised first');
    }
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
    bridgeAddress: string,
    amount: bigint,
    targetChainId: number
  ) {
    this.assertInitialized();

    const walletAddress = await signer.getAddress();
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);

    const nonce = await tokenContract.nonces(walletAddress);
    const name = await tokenContract.name();
    const chainId = (await this.provider!.getNetwork()).chainId;

    const domain = {
      name,
      version: '1',
      chainId,
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

    const bridge = new ethers.Contract(bridgeAddress, [
      'function lockWithPermit(address token,uint256 amount,address to,uint256 targetChainId,uint256 deadline,uint8 v,bytes32 r,bytes32 s) external'
    ], this.signer);

    const tx = await bridge.lockWithPermit(
      tokenAddress,
      amount,
      bridgeAddress,
      targetChainId,
      deadline,
      v, r, s
    );

    console.log('tx:', tx.hash);
    await tx.wait();
  }
}

export default Relayer;
