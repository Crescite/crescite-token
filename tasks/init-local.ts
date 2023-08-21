import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DEV_ACCOUNT_1,
  getTokenContractAddress,
  HARDHAT_ACCOUNT_1,
  HARDHAT_ACCOUNT_2,
  HARDHAT_STAKING_CONTRACT
} from '../util';

function applyNetwork(opts: Record<string, string> = {}) {
  return {
    ...opts,
    network: 'hardhat'
  }
}

task('init:local', 'Deploy contracts to local network, mint tokens')
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
      await hre.run('crescite:deploy', applyNetwork());
      await hre.run('staking:deploy', applyNetwork({ cresciteContract: getTokenContractAddress(hre) }));
      await hre.run('mint', applyNetwork({ account: HARDHAT_ACCOUNT_1, amount: '100000000' }));
      await hre.run('mint', applyNetwork({ account: HARDHAT_ACCOUNT_2, amount: '550000000' }));
      await hre.run('mint', applyNetwork({ account: DEV_ACCOUNT_1, amount: '25000' }));
      await hre.run('mint', applyNetwork({ account: HARDHAT_STAKING_CONTRACT, amount: '13200000000' }));
    }
  );
