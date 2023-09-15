import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Crescite } from '../typechain-types';
import { Roles } from './util/roles';

async function deployFixtures() {
  const [owner, otherAccount] = await ethers.getSigners();
  const token = (await ethers.deployContract('Crescite', owner)) as Crescite;
  await token.deployed();

  return { token, owner, otherAccount };
}

describe('Crescite', () => {
  it('must not mint any tokens', async () => {
    const { token } = await loadFixture(deployFixtures);
    await expect(token.totalSupply()).eventually.to.equal(0);
  });

  it('must have symbol CRE', async () => {
    const { token } = await loadFixture(deployFixtures);
    await expect(token.symbol()).eventually.to.eq('CRE');
  });

  it('must grant roles to deploying account', async () => {
    const { token, owner } = await loadFixture(deployFixtures);

    await expect(
      token.hasRole(Roles.DEFAULT_ADMIN_ACCOUNT, owner.address),
      'DEFAULT_ADMIN_ROLE not granted',
    ).eventually.to.be.true;

    await expect(
      token.hasRole(Roles.SNAPSHOT_ROLE, owner.address),
      'SNAPSHOT_ROLE not granted',
    ).eventually.to.be.true;

    await expect(
      token.hasRole(Roles.PAUSER_ROLE, owner.address),
      'PAUSER_ROLE not granted',
    ).eventually.to.be.true;

    await expect(
      token.hasRole(Roles.MINTER_ROLE, owner.address),
      'MINTER_ROLE not granted',
    ).eventually.to.be.true;
  });

  it('must only permit mint() calls from accounts with MINTER_ROLE role', async () => {
    const { token, otherAccount } = await loadFixture(deployFixtures);
    expect(
      token.connect(otherAccount).mint(otherAccount.address, 1000),
    ).to.be.revertedWith('Fish');
  });

  it('must only permit pause() calls from accounts with PAUSER_ROLE role', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    await expect(token.connect(otherAccount).pause()).to.be.reverted;
    await expect(token.connect(owner).pause()).not.to.be.reverted;
  });

  it('must only permit unpause() calls from accounts with PAUSER_ROLE role', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    // pause contract to ensure call to unpause() isn't reverted due to not being paused
    await expect(token.connect(owner).pause()).not.to.be.reverted;

    await expect(token.connect(otherAccount).unpause()).to.be.reverted;
    await expect(token.connect(owner).unpause()).not.to.be.reverted;
  });

  it('must only permit snapshot() calls from accounts with SNAPSHOT_ROLE role', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    await expect(token.connect(owner).snapshot()).not.to.be.reverted;
    await expect(token.connect(otherAccount).snapshot()).to.be.reverted;
  });

  it('must revert transfers when paused', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    await token.pause();

    await expect(token.transfer(otherAccount.address, 1)).to.be.revertedWith(
      'Pausable: paused',
    );
  });
});
