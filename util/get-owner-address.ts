import { HardhatRuntimeEnvironment } from 'hardhat/types';

export async function getOwnerAddress(hre: HardhatRuntimeEnvironment): Promise<string> {
  return (await hre.ethers.getSigners())[0].getAddress()
}
