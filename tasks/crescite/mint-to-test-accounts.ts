import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { logSymbol, TESTER_ACCOUNTS } from '../../util';

/**
 * Mint CRE to test accounts specified in TESTER_ACCOUNTS env variable
 * Tester accounts are the testing cohort of users appointed by Crescite
 *
 * TESTER_ACCOUNTS env var should contain csv of addresses
 */
task('crescite:mint-to-test-accounts').setAction(
  async (args: any, hre: HardhatRuntimeEnvironment) => {
    for (const address of TESTER_ACCOUNTS) {
      await hre.run('mint', {
        account: address,
        amount: '1000',
        network: hre.network,
      });
    }

    console.log('\n\n', logSymbol.success, 'Done minting to test accounts');
  },
);
