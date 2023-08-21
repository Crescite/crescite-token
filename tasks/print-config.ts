import { task } from 'hardhat/config';
import config from '../hardhat.config';

task('print-config', 'Prints the config', async (taskArgs, hre) => {
  console.log('config:')
  console.log(JSON.stringify(config));
  console.log();
});
