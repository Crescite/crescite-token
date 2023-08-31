import chalk from 'chalk';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { logSymbol, xdcAddressToEth } from '../../util';

task('staking:deploy', 'Deploys the Staking contract')
  .addParam('cresciteContract', 'Address of the Crescite token contract')
  .setAction(async ({ cresciteContract }, hre: HardhatRuntimeEnvironment) => {
    const APR = hre.network.name === 'xinfin' ? 12 : 250;

    console.log(chalk.bold(`Deploying Staking to ${hre.network.name}`));
    console.log(`- CRE contract address ${chalk.yellow(cresciteContract)}`);
    console.log(`- APR is set to ${chalk.yellow(APR)}%`);

    try {
      const Staking = await hre.ethers.getContractFactory('Staking');
      const staking = await Staking.deploy(xdcAddressToEth(cresciteContract), APR);
      await staking.deployed();

      console.log(logSymbol.success, chalk.green(`Staking contract deployed to ${staking.address}`));

      if (['localhost', 'hardhat'].includes(hre.network.name)) {
        await (hre as any).ethernal.push({
          name: 'Staking',
          address: staking.address
        })
      }
    } catch (e) {
      console.error(e);
    }
  });

