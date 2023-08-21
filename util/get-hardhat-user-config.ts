import { HardhatUserConfig } from 'hardhat/config';
import {
  APOTHEM_NETWORK_URL,
  APOTHEM_PRIVATE_KEY, DEV_ACCOUNT_1, DEV_ACCOUNT_1_PRIVATE_KEY, ETHERNAL_WORKSPACE,
  HARDHAT_NETWORK_URL,
  HARDHAT_PRIVATE_KEY,
  XINFIN_NETWORK_URL, XINFIN_PRIVATE_KEY
} from './env';

export function getHardhatUserConfig(): HardhatUserConfig & { ethernal: any } {
  return {
    solidity: {
      version: '0.8.17',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    },
    // Use localhost for deploying contracts and running tasks
    defaultNetwork: 'localhost',
    networks: {
      hardhat: {
        mining: {
          auto: true,
          // interval: 10000,
        },

        // Simplify the Hardhat defaults (10 accounts not required)
        accounts: [
          {
            privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            balance: '10000000000000000000'
          },
          {
            privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
            balance: '5000000000000000000'
          },
          {
            privateKey: DEV_ACCOUNT_1_PRIVATE_KEY,
            balance: '1000000000000000000'
          },
        ]
      },
      localhost: {
        url: HARDHAT_NETWORK_URL,
        accounts: [HARDHAT_PRIVATE_KEY],
      },
      apothem: {
        url: APOTHEM_NETWORK_URL,
        accounts: [APOTHEM_PRIVATE_KEY],
      },
      xinfin: {
        url: XINFIN_NETWORK_URL,
        accounts: [XINFIN_PRIVATE_KEY],
      },
    },
    ethernal: {
      resetOnStart: ETHERNAL_WORKSPACE,
      disabled: process.env.NODE_ENV !== 'test',
    }
  };
}
