import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Crescite } from '../typechain-types';
import { formatEther } from './format-ether';
import { xdcAddressToEth } from './xdc-address-to-eth';

export async function getBalance(account: string, crescite: Crescite, hre: HardhatRuntimeEnvironment): Promise<string> {
  const balance = await crescite.balanceOf(xdcAddressToEth(account));
  return formatEther(balance, hre);
}
