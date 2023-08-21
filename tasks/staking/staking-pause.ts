import chalk from 'chalk';
import { task } from 'hardhat/config';
import { bindToStaking, logSymbol } from '../../util';

task('staking:pause', 'Pauses the Staking contract, preventing staking/unstaking', async (taskArgs, hre) => {
  const staking = await bindToStaking(hre);
  await staking.pause();

  console.log(logSymbol.success, chalk.green('Staking contract is now paused'));
});
