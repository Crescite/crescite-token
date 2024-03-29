import { task } from 'hardhat/config';
import {
  HARDHAT_STAKING_CONTRACT,
  HARDHAT_TOKEN_CONTRACT,
  xdcAddressToEth,
} from '../util';

/**
 * Push contract ABI and debug info to Ethernal local block explorer
 *
 * @see https://app.tryethernal.com/
 */
task('ethernal-push').setAction(async (args: any, hre: any) => {
  await hre.ethernal.push({
    name: 'Crescite',
    address: xdcAddressToEth(HARDHAT_TOKEN_CONTRACT),
  });

  await hre.ethernal.push({
    name: 'Staking_V1',
    address: xdcAddressToEth(HARDHAT_STAKING_CONTRACT),
  });
});
