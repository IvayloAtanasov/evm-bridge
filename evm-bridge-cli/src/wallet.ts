import { Wallet } from 'ethers';

export function getWallet() {
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || '');

  return wallet;
}
