import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { stakingAddresses } from './env';

/**
 * Get the address of the Staking contract as set in .env
 */
export function getStakingContractAddress(hre: HardhatRuntimeEnvironment) {
  const networkName = hre.network.name;

  if (!['hardhat', 'localhost', 'apothem', 'xinfin'].includes(networkName)) {
    throw new Error(`getStakingContractAddress(): unknown network ${networkName}`);
  }

  if (!stakingAddresses[networkName]) {
    throw new Error(`no staking address for network "${networkName}"`);
  }

  return stakingAddresses[networkName];
}
