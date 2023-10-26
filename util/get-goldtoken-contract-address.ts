import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { goldTokenAddresses } from './env';

/**
 * Get the address of the Crescite contract as set in .env
 */
export function getGoldTokenContractAddress(hre: HardhatRuntimeEnvironment) {
  const networkName = hre.network.name;

  if (!['hardhat', 'localhost', 'apothem', 'xinfin'].includes(networkName)) {
    throw new Error(`getTokenContractAddress(): unknown network ${networkName}`);
  }

  if (!goldTokenAddresses[networkName]) {
    throw new Error(`no token address for network "${networkName}"`);
  }

  return goldTokenAddresses[networkName];
}
