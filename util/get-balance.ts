import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { IERC20 } from '../typechain-types';
import { formatEther } from './format-ether';
import { xdcAddressToEth } from './xdc-address-to-eth';

export async function getBalance(
  account: string,
  erc20Token: IERC20,
  hre: HardhatRuntimeEnvironment,
): Promise<string> {
  const balance = await erc20Token.balanceOf(xdcAddressToEth(account));
  return formatEther(balance, hre);
}
