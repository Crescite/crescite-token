import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { tokenAddresses } from './env';

/**
 * Get the address of the Crescite contract as set in .env
 */
export function getTokenContractAddress(hre: HardhatRuntimeEnvironment) {
  const networkName = hre.network.name;

  if (!['hardhat', 'localhost', 'apothem', 'xinfin'].includes(networkName)) {
    throw new Error(`getTokenContractAddress(): unknown network ${networkName}`);
  }

  if (!tokenAddresses[networkName]) {
    throw new Error(`no token address for network "${networkName}"`);
  }

  return tokenAddresses[networkName];
}
