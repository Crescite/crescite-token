import chalk from 'chalk';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { logSymbol } from '../../util';
import { mockTokenDefinitions } from './mock-token-definitions';

task('deploy:mocks', 'Deploys mock ERC20 tokens')
  .addOptionalParam('account', 'The account to mint tokens to')
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const deployedTokens = [];

    for (let tokenData of mockTokenDefinitions) {
      const Token = await hre.ethers.getContractFactory('MockToken');
      const token = await Token.deploy(
        tokenData.name,
        tokenData.symbol,
        tokenData.initialSupply,
      );

      await token.deployed();
      deployedTokens.push(token);

      console.log(
        logSymbol.success,
        chalk.green(`${tokenData.name} ${tokenData.symbol} deployed to:`, token.address),
      );

      await (hre as any).ethernal.push({
        name: 'MockToken',
        address: token.address,
      });
    }

    if (taskArgs.account) {
      for (let token of deployedTokens) {
        await token.mint(taskArgs.account, hre.ethers.utils.parseEther('1000'));
        console.log(
          logSymbol.success,
          `Minted 1000 ${await token.symbol()} to ${taskArgs.account}`,
        );
      }
    }
  });
