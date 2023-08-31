import { EthernalConfig } from 'hardhat-ethernal/dist/types';
import { HardhatUserConfig } from 'hardhat/config';
import {
  APOTHEM_NETWORK_URL,
  APOTHEM_PRIVATE_KEY,
  DEV_ACCOUNT_1_PRIVATE_KEY,
  ETHERNAL_WORKSPACE,
  HARDHAT_ACCOUNT_2_PRIVATE_KEY,
  HARDHAT_NETWORK_URL,
  HARDHAT_PRIVATE_KEY,
  XINFIN_NETWORK_URL,
  XINFIN_PRIVATE_KEY
} from './env';

export function getHardhatUserConfig(): HardhatUserConfig {
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
          auto: false,
          interval: 2000,
        },

        // Simplify the Hardhat defaults (10 accounts not required)
        accounts: [
          {
            privateKey: HARDHAT_PRIVATE_KEY,
            balance: '10000000000000000000'
          },
          {
            privateKey: HARDHAT_ACCOUNT_2_PRIVATE_KEY,
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
      disabled: process.env.NODE_ENV === 'test',
    } as EthernalConfig
  };
}
