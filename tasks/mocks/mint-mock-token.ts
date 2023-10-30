import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { cliFormatSuccess, logSymbol } from '../../util';

task('mint:mock-token', 'Mints 1000 tokens to an account')
  .addParam('contract', 'The address of the token to mint')
  .addParam('account', 'The account to mint tokens to (e.g. 1000)')
  .addParam('amount', 'The quantity of tokens to mint')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const token = await hre.ethers.getContractAt('MockToken', taskArgs.contract);
    await token.mint(taskArgs.account, hre.ethers.utils.parseEther(taskArgs.amount));

    console.log(
      logSymbol.success,
      cliFormatSuccess(`Minted 1000 ${await token.symbol()} to ${taskArgs.account}`),
    );
  });
