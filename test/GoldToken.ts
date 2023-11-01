import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { GoldToken } from '../typechain-types';
import { Roles } from './util/roles';

async function deployFixtures() {
  const [owner, otherAccount] = await ethers.getSigners();
  const token = (await ethers.deployContract('GoldToken', owner)) as GoldToken;
  await token.deployed();

  return { token, owner, otherAccount };
}

describe('GoldToken', () => {
  it('must not mint any tokens', async () => {
    const { token } = await loadFixture(deployFixtures);
    await expect(token.totalSupply()).eventually.to.equal(0);
  });

  it('must have symbol GLD', async () => {
    const { token } = await loadFixture(deployFixtures);
    await expect(token.symbol()).eventually.to.eq('GLD');
  });

  it('must grant roles to deploying account', async () => {
    const { token, owner } = await loadFixture(deployFixtures);

    await expect(
      token.hasRole(Roles.MINTER_ROLE, owner.address),
      'MINTER_ROLE not granted',
    ).eventually.to.be.true;
  });

  it('must only permit mint() calls from accounts with MINTER_ROLE role', async () => {
    const { token, otherAccount } = await loadFixture(deployFixtures);
    await expect(
      token.connect(otherAccount).mint(otherAccount.address, 1000),
    ).to.be.revertedWith('AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6');
  });

  describe('GoldToken - Blacklist Functionality', () => {
    it('only owner can blacklist an address', async () => {
      const { token, otherAccount } = await loadFixture(deployFixtures);
      await expect(token.blacklistAddress(otherAccount.address)).to.emit(token, 'Blacklisted');
      await expect(token.connect(otherAccount).blacklistAddress(otherAccount.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });
  
    it('only owner can unblacklist an address', async () => {
      const { token, otherAccount } = await loadFixture(deployFixtures);
      await token.blacklistAddress(otherAccount.address);
      await expect(token.unblacklistAddress(otherAccount.address)).to.emit(token, 'Unblacklisted');
      await expect(token.connect(otherAccount).unblacklistAddress(otherAccount.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });
  
    it('blacklisted address cannot transfer tokens', async () => {
      const { token, owner, otherAccount } = await loadFixture(deployFixtures);
      await token.mint(otherAccount.address, 1000);
      await token.blacklistAddress(otherAccount.address);
      await expect(token.connect(otherAccount).transfer(owner.address, 500)).to.be.revertedWith('Sender is blacklisted');
    });
  
    it('blacklisted address cannot receive tokens', async () => {
      const { token, owner, otherAccount } = await loadFixture(deployFixtures);
      await token.mint(owner.address, 1000);
      await token.blacklistAddress(otherAccount.address);
      await expect(token.transfer(otherAccount.address, 500)).to.be.revertedWith('Recipient is blacklisted');
    });
  
    it('non-blacklisted address can transfer and receive tokens', async () => {
      const { token, owner, otherAccount } = await loadFixture(deployFixtures);
      await token.mint(owner.address, 1000);
      await token.transfer(otherAccount.address, 500);
      expect(await token.balanceOf(otherAccount.address)).to.equal(500);
    });
  
  });
  

});
