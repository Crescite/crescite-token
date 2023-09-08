import chalk from 'chalk';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { logSymbol } from '../../util';

task(
  'crescite:deploy',
  'Deploys the Crescite contract',
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(chalk.bold('Deploying Crescite to', hre.network.name));

    try {
      const Crescite = await hre.ethers.getContractFactory('Crescite');
      const crescite = await Crescite.deploy();
      await crescite.deployed();

      console.log(
        logSymbol.success,
        'Crescite deployed to',
        chalk.green(crescite.address),
      );

      if (['localhost', 'hardhat'].includes(hre.network.name)) {
        await (hre as any).ethernal.push({
          name: 'Crescite',
          address: crescite.address,
        });
      }

      return crescite.address;
    } catch (e) {
      console.error(e);
    }
  },
);
