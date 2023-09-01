import { task } from 'hardhat/config';
import { bindToCrescite, formatNumberString, getTotalSupply } from '../util';

task(
  'total-supply',
  'Prints out the total supply of the token',
  async (taskArgs, hre) => {
    const crescite = await bindToCrescite(hre);
    console.log(formatNumberString(await getTotalSupply(crescite, hre)));
  },
);
