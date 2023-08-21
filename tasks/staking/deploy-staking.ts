import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { xdcAddressToEth } from '../../util';

task('staking:deploy', 'Deploys the Staking contract')
  .addParam('cresciteContract', 'Address of the Crescite token contract')
  .setAction(async ({ cresciteContract }, hre: HardhatRuntimeEnvironment) => {
    console.log('Deploying Staking to', hre.network.name);

    const APR = hre.network.name === 'xinfin' ? 12 : 250;
    console.log(`APR is set to ${APR}%`);

    try {
      const Staking = await hre.ethers.getContractFactory('Staking');
      const staking = await Staking.deploy(xdcAddressToEth(cresciteContract), APR);
      await staking.deployed();

      console.log('Staking contract deployed to', staking.address);

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

