import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import chalk from 'chalk';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { logSymbol, xdcAddressToEth } from '../../util';

task('staking:deploy:v1', 'Deploys the upgradeable Staking_V1 contract')
  .addParam('tokenAddress', 'Address of the ERC20 token that will be staked')
  .addParam('apr', 'Set the staking contract APR (e.g. 12)')
  .setAction(async ({ tokenAddress, apr }, hre: HardhatRuntimeEnvironment) => {
    const contractFactory = await hre.ethers.getContractFactory('Staking_V1');

    const result = await hre.upgrades.deployProxy(
      contractFactory,
      [xdcAddressToEth(tokenAddress), Number(apr)],
      { kind: 'uups' },
    );

    const proxyContract = await result.deployed();

    await hre.ethernal.push({
      name: 'Staking_V1',
      address: proxyContract.address,
    });

    const implementationAddress = await getImplementationAddress(
      hre.ethers.provider,
      proxyContract.address,
    );

    console.log(
      logSymbol.success,
      chalk.green(
        `Staking_V1 (proxy - mint tokens to this address): ${proxyContract.address}`,
      ),
    );

    console.log(
      logSymbol.success,
      chalk.green(`Staking_V1 (implementation): ${implementationAddress}`),
    );

    return result.address;
  });
