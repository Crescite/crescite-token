require('dotenv').config({ path: '.env' });

export const ETHERNAL_WORKSPACE = process.env.ETHERNAL_WORKSPACE as string;

export const HARDHAT_ACCOUNT_1 = process.env.HARDHAT_ACCOUNT_1 as string;
export const HARDHAT_ACCOUNT_2 = process.env.HARDHAT_ACCOUNT_2 as string;

// for use in a second metamask instance, testing multiple users & contract events
export const DEV_ACCOUNT_1 = process.env.DEV_ACCOUNT_1 as string;
export const DEV_ACCOUNT_1_PRIVATE_KEY = process.env.DEV_ACCOUNT_1_PRIVATE_KEY as string;

export const HARDHAT_TOKEN_CONTRACT = process.env.HARDHAT_TOKEN_CONTRACT as string;
export const HARDHAT_STAKING_CONTRACT = process.env.HARDHAT_STAKING_CONTRACT as string;
export const HARDHAT_NETWORK_URL = process.env.HARDHAT_NETWORK_URL as string;

// needs to be renamed HARDHAT_ACCOUNT_1_PRIVATE_KEY:
export const HARDHAT_PRIVATE_KEY = process.env.HARDHAT_PRIVATE_KEY as string;

export const HARDHAT_ACCOUNT_2_PRIVATE_KEY = process.env.HARDHAT_ACCOUNT_2_PRIVATE_KEY as string;

export const APOTHEM_NETWORK_URL = process.env.APOTHEM_NETWORK_URL as string;
export const APOTHEM_TOKEN_CONTRACT = process.env.APOTHEM_TOKEN_CONTRACT as string;
export const APOTHEM_STAKING_CONTRACT = process.env.APOTHEM_STAKING_CONTRACT as string;
export const APOTHEM_PRIVATE_KEY = process.env.APOTHEM_PRIVATE_KEY as string;

export const XINFIN_NETWORK_URL = process.env.XINFIN_NETWORK_URL as string;
export const XINFIN_TOKEN_CONTRACT = process.env.XINXIN_TOKEN_CONTRACT as string;
export const XINFIN_STAKING_CONTRACT = process.env.XINFIN_STAKING_CONTRACT as string;
export const XINFIN_PRIVATE_KEY = process.env.XINFIN_PRIVATE_KEY as string;

export const tokenAddresses: Record<string, string> = {
  localhost: HARDHAT_TOKEN_CONTRACT,
  hardhat: HARDHAT_TOKEN_CONTRACT,
  apothem: APOTHEM_TOKEN_CONTRACT,
  xinfin: XINFIN_TOKEN_CONTRACT
};

export const stakingAddresses: Record<string, string> = {
  localhost: HARDHAT_STAKING_CONTRACT,
  hardhat: HARDHAT_STAKING_CONTRACT,
  apothem: APOTHEM_STAKING_CONTRACT,
  xinfin: XINFIN_STAKING_CONTRACT
};
