import { BigNumberish } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

export function formatEther(
  amount: BigNumberish,
  hre: HardhatRuntimeEnvironment,
): string {
  return hre.ethers.utils.formatEther(amount);
}
