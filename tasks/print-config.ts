import { task } from 'hardhat/config';
import { getHardhatUserConfig } from '../util';

task('print-config', 'Prints the config', async () => {
  console.log(JSON.stringify(getHardhatUserConfig()));
});
