import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { formatEther } from './format-ether';
import { IERC20 } from '../typechain-types';

export async function getTotalSupply(
  erc20Token: IERC20,
  hre: HardhatRuntimeEnvironment,
): Promise<string> {
  const totalSupply = await erc20Token.totalSupply();
  return formatEther(totalSupply, hre);
}
