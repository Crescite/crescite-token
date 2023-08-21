import { task } from 'hardhat/config';
import { bindToStaking } from '../../util';

task('staking:resume', 'Resumes the Staking contract, staking/unstaking then allowed', async (taskArgs, hre) => {
  const staking = await bindToStaking(hre);
  await staking.resume();

  console.log('Staking contract resumed');
});
