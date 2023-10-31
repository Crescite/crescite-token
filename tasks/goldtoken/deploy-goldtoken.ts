import chalk from 'chalk';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { logSymbol } from '../../util';

task(
  'goldtoken:deploy',
  'Deploys the GoldToken contract',
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(chalk.bold('Deploying goldtoken to', hre.network.name));

    try {
      const GoldToken = await hre.ethers.getContractFactory('GoldToken');
      const goldtoken = await GoldToken.deploy();
      await goldtoken.deployed();

      console.log(
        logSymbol.success,
        'goldtoken deployed to',
        chalk.green(goldtoken.address),
      );

      if (['localhost', 'hardhat'].includes(hre.network.name)) {
        await (hre as any).ethernal.push({
          name: 'GoldToken',
          address: goldtoken.address,
        });
      }
      console.log(`************************* foobar ****************`)

      return goldtoken.address;
    } catch (e) {
      console.error(e);
    }
  },
);
