import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

task('deploy:crescite', 'Deploys the Crescite contract', async (taskArgs, hre: HardhatRuntimeEnvironment) => {
  console.log('Deploying Crescite to', hre.network.name);

  try {
    const Crescite = await hre.ethers.getContractFactory('Crescite');
    const crescite = await Crescite.deploy();
    await crescite.deployed();

    console.log('Crescite deployed to', crescite.address);

    if(['localhost', 'hardhat'].includes(hre.network.name)) {
      await (hre as any).ethernal.push({
        name: 'Crescite',
        address: crescite.address
      });
    }
  } catch(e) {
    console.error(e);
  }
});
