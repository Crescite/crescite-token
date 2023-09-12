import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { Crescite, Staking_V1 } from '../typechain-types';
import { HARDHAT_ACCOUNT_1 } from '../util';
import { Roles } from './util/roles';

async function deployFixtures() {
  const [owner, otherAccount] = await ethers.getSigners();

  // Crescite token must be deployed first
  const crescite = (await ethers.deployContract('Crescite', owner)) as Crescite;
  await crescite.deployed();

  const contractFactory = await ethers.getContractFactory('Staking_V1');
  const escapeHatchDestination = HARDHAT_ACCOUNT_1;
  const contractInitialiseParams = [crescite.address, 12, escapeHatchDestination];

  const contract = (await upgrades.deployProxy(
    contractFactory,
    contractInitialiseParams,
    {
      kind: 'uups',
    },
  )) as Staking_V1;

  await contract.deployed();

  return {
    proxyAddress: contract.address,
    Staking_V1: contract,
    owner,
    otherAccount,
    crescite,
  };
}

describe('Staking_V1', function () {
  it('must deploy', async () => {
    await loadFixture(deployFixtures);
  });

  it('must grant DEFAULT_ADMIN_ROLE to deploying account', async () => {
    const { Staking_V1, owner } = await loadFixture(deployFixtures);

    await expect(Staking_V1.hasRole(Roles.DEFAULT_ADMIN_ACCOUNT, owner.address))
      .eventually.to.be.true;
  });

  it('must grant ESCAPE_CALLER_ROLE to deploying account', async () => {
    const { Staking_V1, owner } = await loadFixture(deployFixtures);

    await expect(Staking_V1.hasRole(Roles.ESCAPE_CALLER_ROLE, owner.address)).eventually
      .to.be.true;
  });

  it('must only permit account with ESCAPE_CALLER_ROLE to call escapeHatch()', async () => {
    const { Staking_V1, owner, otherAccount } = await loadFixture(deployFixtures);

    // call with owner account
    await expect(Staking_V1.connect(owner).escapeHatch()).not.to.be.reverted;

    // call with another account not granted the role
    await expect(Staking_V1.connect(otherAccount).escapeHatch()).to.be.revertedWith(
      'Escapable: not permitted',
    );
  });

  /**
   * Uncomment this once Staking_V2 is ready to go if needed
   * proxyAddress contains address of the proxy to upgrade
   */
  // it.skip('upgrades', async () => {
  //   const { proxyAddress, crescite } = loadFixtures(deployFixtures);
  //   const Staking_V2 = await ethers.getContractFactory('Staking_V2');
  //   const { address } = await upgrades.upgradeProxy(proxyAddress, Staking_V2);
  //
  //   const contract = (await ethers.getContractAt('Staking_V2', address)) as Staking_V2;
  //   await contract.initializeV2(crescite.address, 12);
  // });
});
