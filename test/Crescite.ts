import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Crescite } from '../typechain-types';

describe('Crescite', () => {
  it('should not mint any tokens to owner account', async () => {
    const [owner] = await ethers.getSigners();

    const cresciteToken = (await ethers.deployContract('Crescite')) as Crescite;

    const ownerBalance = await cresciteToken.balanceOf(owner.address);
    expect(ownerBalance).to.equal(0);
  });
});
