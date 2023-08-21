import { task } from 'hardhat/config';
import { bindToStaking } from '../../util';

task('staking:pause', 'Pauses the Staking contract, preventing staking/unstaking', async (taskArgs, hre) => {
  const staking = await bindToStaking(hre);
  await staking.pause();

  console.log('Staking contract is now paused');
});
