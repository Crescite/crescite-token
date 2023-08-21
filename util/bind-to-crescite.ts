import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Crescite } from '../typechain-types';
import { getTokenContractAddress } from './get-token-contract-address';
import { xdcAddressToEth } from './xdc-address-to-eth';

export async function bindToCrescite(hre: HardhatRuntimeEnvironment): Promise<Crescite> {
  const tokenContract = getTokenContractAddress(hre);

  const CresciteFactory = await hre.ethers.getContractFactory('Crescite');
  const crescite = CresciteFactory.attach(xdcAddressToEth(tokenContract));
  return crescite;
}
