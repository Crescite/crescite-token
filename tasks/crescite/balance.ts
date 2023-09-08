import { task } from 'hardhat/config';
import { bindToCrescite, formatNumberString, getBalance } from '../../util';

task('balance', 'Get balance of account')
  .addParam('account', 'the address of the account')
  .setAction(async ({ account }, hre) => {
    const crescite = await bindToCrescite(hre);
    const balance = await getBalance(account, crescite, hre);
    console.log(formatNumberString(balance));
  });
