import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Crescite } from '../typechain-types';
import { formatEther } from './format-ether';

export async function getTotalSupply(
  crescite: Crescite,
  hre: HardhatRuntimeEnvironment,
): Promise<string> {
  const totalSupply = await crescite.totalSupply();
  return formatEther(totalSupply, hre);
}
