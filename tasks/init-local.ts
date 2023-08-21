import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DEV_ACCOUNT_1,
  HARDHAT_ACCOUNT_1,
  HARDHAT_ACCOUNT_2,
  HARDHAT_STAKING_CONTRACT,
  HARDHAT_TOKEN_CONTRACT
} from '../util';

function applyNetwork(opts: Record<string, string> = {}) {
  return {
    ...opts,
    network: 'hardhat'
  }
}

task('init:local', 'Deploy contracts to local network, mint tokens')
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    await hre.run('deploy:crescite', applyNetwork());
    await hre.run('deploy:staking', applyNetwork({ cresciteContract: HARDHAT_TOKEN_CONTRACT }));
    await hre.run('mint', applyNetwork({ account: HARDHAT_ACCOUNT_1, amount: '10000' }));
    await hre.run('mint', applyNetwork({ account: HARDHAT_ACCOUNT_2, amount: '5000' }));
    await hre.run('mint', applyNetwork({ account: DEV_ACCOUNT_1, amount: '25000' }));
    await hre.run('mint', applyNetwork({ account: HARDHAT_STAKING_CONTRACT, amount: '50000000' }));
  }
);
