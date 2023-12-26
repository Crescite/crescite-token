// Define the task
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { cliFormatInfo, cliFormatSuccess, logSymbol } from '../util';

task('resolve-account', 'Get a public key from a mnemonic')
  .addParam('mnemonic', 'The mnemonic to restore from')
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    //
    // if HD mnemonic (13 - 24 words) this will restore the first account
    //
    if (taskArgs.mnemonic.split(' ').length > 12) {
      const node = hre.ethers.utils.HDNode.fromMnemonic(taskArgs.mnemonic);
      const account1 = node.derivePath("m/44'/60'/0'/0/0");

      console.log(logSymbol.success, 'Address', cliFormatInfo(account1.address));
      console.log(
        logSymbol.success,
        'Private Key',
        cliFormatSuccess(account1.privateKey),
      );
    } else {
      //
      // if not HD mnemonic (12 words) this will restore
      //
      const wallet = hre.ethers.Wallet.fromMnemonic(taskArgs.mnemonic);

      // Output the private key
      console.log(logSymbol.success, 'Address', cliFormatInfo(wallet.address));
      console.log(logSymbol.success, 'Private Key', cliFormatSuccess(wallet.privateKey));
    }
  });
