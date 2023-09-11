import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Crescite } from '../typechain-types';
import { toKeccak256 } from './util/to-keccak-256';

async function deployFixtures() {
  const [owner, otherAccount] = await ethers.getSigners();
  const token = (await ethers.deployContract('Crescite', owner)) as Crescite;
  await token.deployed();

  return { token, owner, otherAccount };
}

describe('Crescite', () => {
  it('should not mint any tokens', async () => {
    const { token } = await loadFixture(deployFixtures);
    await expect(token.totalSupply()).eventually.to.equal(0);
  });

  it('should have symbol CRE', async () => {
    const { token } = await loadFixture(deployFixtures);
    await expect(token.symbol()).eventually.to.eq('CRE');
  });

  it('should grant roles to deploying account', async () => {
    const { token, owner } = await loadFixture(deployFixtures);

    async function hasRole(roleName: string) {
      return token.hasRole(toKeccak256(roleName), owner.address);
    }

    await expect(
      token.hasRole(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        owner.address,
      ),
      'DEFAULT_ADMIN_ROLE not granted',
    ).eventually.to.be.true;

    await expect(hasRole('SNAPSHOT_ROLE'), 'SNAPSHOT_ROLE not granted').eventually.to.be
      .true;

    await expect(hasRole('PAUSER_ROLE'), 'PAUSER_ROLE not granted').eventually.to.be.true;
    await expect(hasRole('MINTER_ROLE'), 'MINTER_ROLE not granted').eventually.to.be.true;
  });

  it('should only permit mint() calls from accounts with MINTER_ROLE role', async () => {
    const { token, otherAccount } = await loadFixture(deployFixtures);
    expect(
      token.connect(otherAccount).mint(otherAccount.address, 1000),
    ).to.be.revertedWith('Fish');
  });

  it('should only permit pause() calls from accounts with PAUSER_ROLE role', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    await expect(token.connect(otherAccount).pause()).to.be.reverted;
    await expect(token.connect(owner).pause()).not.to.be.reverted;
  });

  it('should only permit unpause() calls from accounts with PAUSER_ROLE role', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    // pause contract to ensure call to unpause() isn't reverted due to not being paused
    await expect(token.connect(owner).pause()).not.to.be.reverted;

    await expect(token.connect(otherAccount).unpause()).to.be.reverted;
    await expect(token.connect(owner).unpause()).not.to.be.reverted;
  });

  it('should only permit snapshot() calls from accounts with SNAPSHOT_ROLE role', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    await expect(token.connect(owner).snapshot()).not.to.be.reverted;
    await expect(token.connect(otherAccount).snapshot()).to.be.reverted;
  });

  it('should revert transfers when paused', async () => {
    const { token, otherAccount, owner } = await loadFixture(deployFixtures);

    await token.pause();

    await expect(token.transfer(otherAccount.address, 1)).to.be.revertedWith(
      'Pausable: paused',
    );
  });
});
