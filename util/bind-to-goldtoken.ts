import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { GoldToken } from '../typechain-types';
import { getGoldTokenContractAddress } from './get-goldtoken-contract-address';
import { xdcAddressToEth } from './xdc-address-to-eth';

export async function bindToGoldToken(hre: HardhatRuntimeEnvironment): Promise<GoldToken> {
  const tokenContract = getGoldTokenContractAddress(hre);

  const CresciteFactory = await hre.ethers.getContractFactory('Crescite');
  const crescite = CresciteFactory.attach(xdcAddressToEth(tokenContract));
  return crescite;
}
