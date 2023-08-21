import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { Crescite, Staking } from '../typechain-types';
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { formatEther } from '../util';

async function deployFixtures() {
  // await network.provider.send("evm_setNextBlockTimestamp", [thirtiethDec2022]);
  const crescite = await ethers.deployContract('Crescite') as Crescite;
  const staking = await ethers.deployContract('StakingTestHarness', [crescite.address]) as Staking;

  const signers = await ethers.getSigners();

  const account1 = signers[0].address;
  const account2 = signers[1].address;

  await crescite.mint(account1, 2000);
  await crescite.mint(account2, 2000);
  await crescite.mint(staking.address, 1000000);

  return { crescite, staking, account1, account2, signers };
}

function calculateExpectedRewards(amount: number, timestamp: number) {
  const YEAR_IN_SECONDS = 31536000;

  // Calculate the time elapsed since the stake was made
  const elapsedTime = Math.floor(Date.now() / 1000) - timestamp;

  // Convert the annual percentage rate (APR) to a decimal value
  const annualRate = (amount * 12) / 100;

  // Calculate the rewards based on the stake amount, annual rate, and elapsed time
  const reward = (amount * annualRate * elapsedTime) / YEAR_IN_SECONDS;

  return reward;
}

describe('Staking', () => {
  it('should have 2000 total supply', async () => {
    const { crescite } = await loadFixture(deployFixtures);
    expect(crescite.totalSupply()).eventually.to.equal(2000);
  })

  it('should revert if amount is 0', async () => {
    const { staking } = await loadFixture(deployFixtures);

    await expect(staking.stakeTokens(0)).to.be.revertedWith('Amount must be greater than zero');
  });

  it('should stake tokens', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    expect(crescite.allowance(staking.address, account1)).eventually.to.equal(0);

    // approve the contract to 'spend' CRE
    await crescite.approve(staking.address, 1000, {
      from: account1
    });

    await staking.stakeTokens(1000, {
      from: account1
    });

    expect(staking.userStakingTotals(account1)).eventually.to.equal(1000);
    expect(crescite.balanceOf(account1)).eventually.to.equal(1000);
  });

  it('should allow stake more than once', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    // approve the contract to 'spend' CRE
    await crescite.approve(staking.address, 2000, {
      from: account1
    });

    await staking.stakeTokens(1000, {
      from: account1
    });

    expect(staking.userStakingTotals(account1)).eventually.to.equal(1000);
    expect(crescite.balanceOf(account1)).eventually.to.equal(1000);

    await staking.stakeTokens(1000, {
      from: account1
    });

    expect(staking.userStakingTotals(account1)).eventually.to.equal(2000);
    expect(crescite.balanceOf(account1)).eventually.to.equal(0);
  });

  it('should maintain count of total tokens staked by all users', async () => {
    const { crescite, staking, signers } = await loadFixture(deployFixtures);

    await crescite.connect(signers[0]).approve(staking.address, 2000);
    await crescite.connect(signers[1]).approve(staking.address, 2000);

    await staking.connect(signers[0]).stakeTokens(1000);
    expect(staking.totalStaked()).eventually.to.equal(1000);

    await staking.connect(signers[1]).stakeTokens(500);
    expect(staking.totalStaked()).eventually.to.equal(1500);

    await staking.connect(signers[0]).unstakeTokens();
    expect(staking.totalStaked()).eventually.to.equal(500);

    await staking.connect(signers[1]).unstakeTokens();
    expect(staking.totalStaked()).eventually.to.equal(0);
  });

  describe('unstakeTokens()', () => {
    let Staking: Staking;
    let Crescite: Crescite;
    let address: string;

    beforeEach(async () => {
      const { crescite, staking, signers, account1 } = await loadFixture(deployFixtures);

      address = account1;
      Staking = staking.connect(signers[0]);
      Crescite = crescite.connect(signers[0]);

      // approve the contract to 'spend' CRE
      await Crescite.approve(staking.address, 2000);
    })

    it('should transfer original stake plus rewards to user', async () => {
      await Staking.stakeTokens(1000);

      const ONE_DAY = 86_400;
      const ONE_YEAR = ONE_DAY * 365;

      // now advance the blockchain by 30 days
      await time.increase(ONE_YEAR);

      await Staking.unstakeTokens();

      expect(Crescite.balanceOf(address)).eventually.to.eq(2120);
    });

    it.only('should handle small numbers', async () => {
      await Staking.stakeTokens(1);

      const ONE_DAY = 86_400;
      const ONE_YEAR = ONE_DAY * 365;

      // now advance the blockchain by 30 days
      await time.increase(ONE_YEAR);

      await Staking.unstakeTokens();

      const balanceAfterUnstaking = await Crescite.balanceOf(address);
      console.log('balanceAfterUnstaking', balanceAfterUnstaking.toString());
    })
  })

  it('should revert if insufficient balance', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    // approve the contract to 'spend' all the CRE tokens minted to account1
    await crescite.approve(staking.address, 2000, {
      from: account1
    });

    await expect(staking.stakeTokens(2001, {
      from: account1
    })).to.be.revertedWith('Insufficient token balance')
  });

  it('should allow staking of full account balance', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    // approve the contract to 'spend' all the CRE tokens minted to account1
    await crescite.approve(staking.address, 2000, {
      from: account1
    });

    await staking.stakeTokens(2000, {
      from: account1
    });

    expect(staking.userStakingTotals(account1)).eventually.to.equal(2000);
    expect(crescite.balanceOf(account1)).eventually.to.equal(0);
  });

  it('should count the number of stakers', async () => {
    const { crescite, staking, signers } = await loadFixture(deployFixtures);

    crescite.connect(signers[0]).approve(staking.address, 2000);
    crescite.connect(signers[1]).approve(staking.address, 2000);

    const staking1 = staking.connect(signers[0]);
    const staking2 = staking.connect(signers[1]);

    await staking1.stakeTokens(1000);
    expect(staking.numberOfStakers()).eventually.to.equal(1);

    await staking2.stakeTokens(1000);
    expect(staking.numberOfStakers()).eventually.to.equal(2);

    await staking1.stakeTokens(1000);
    expect(staking.numberOfStakers()).eventually.to.equal(2);

    await staking2.stakeTokens(1000);
    expect(staking.numberOfStakers()).eventually.to.equal(2);

    await staking1.unstakeTokens();
    expect(staking.numberOfStakers()).eventually.to.equal(1);

    await staking2.unstakeTokens();
    expect(staking.numberOfStakers()).eventually.to.equal(0);
  })
});
