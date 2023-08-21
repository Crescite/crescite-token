import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { formatEther } from 'ethers/lib/utils';
import hardhat, { ethers } from 'hardhat';
import { Crescite, StakingTestHarness } from '../typechain-types';
import { log } from './util/log';

// ------------------------------------------------------

// Enable auto-mining
hardhat.config.networks.hardhat.mining.auto = true;

// ------------------------------------------------------

/**
 * Constants
 */
const ONE_DAY = 86_400;
const ONE_YEAR = ONE_DAY * 365;
const APR = 12;

const NORMAL_ACCOUNT_STARTING_BALANCE = 2_000;
const WHALE_ACCOUNT_STARTING_BALANCE = 4_000_000_000;
const STAKING_CONTRACT_BALANCE = 13_200_000_000;


// ------------------------------------------------------

/**
 * Utility functions
 */
async function nextBlockIsOneYearLater() {
  const lastBlockTime = await time.latest();

  return await time.setNextBlockTimestamp(lastBlockTime + ONE_YEAR);
}

async function getLatestBlockTimestamp() {
  return await time.latest();
}

async function mineBlockOneYearLater() {
  const lastBlockTime = await time.latest();
  await time.increaseTo(lastBlockTime + ONE_YEAR);
}

/**
 * Convert given value to a BigNumber with precision 1e18
 */
function big(intValue: number): BigNumber {
  return ethers.utils.parseEther(String(intValue));
}

// ------------------------------------------------------

/**
 * Deploy the Crescite and Staking contracts and mint some CRE tokens
 */
async function deployFixtures() {
  const crescite = await ethers.deployContract('Crescite') as Crescite;
  const staking = await ethers.deployContract('StakingTestHarness', [crescite.address, APR]) as StakingTestHarness;

  // see util/get-hardhat-user-config.ts for the config
  // of the three accounts to be used as signers
  const signers = await ethers.getSigners();

  // this is the account that deploys the contracts
  // and therefore owns then
  // @see getHardhatUserConfig(), first address is the 'owner'
  // @see https://hardhat.org/hardhat-runner/docs/guides/test-contracts#using-a-different-address
  const account1 = signers[0];

  const whaleAccount = signers[1];

  // * whale account holds 3 billion CRE
  //   simulating the amount of CRE released on first mint in 2022
  // * regular account holds 2000 CRE
  // * staking contract holds 13.2 billion CRE
  await crescite.mint(account1.address, big(NORMAL_ACCOUNT_STARTING_BALANCE));
  await crescite.mint(whaleAccount.address, big(WHALE_ACCOUNT_STARTING_BALANCE));
  await crescite.mint(staking.address, big(STAKING_CONTRACT_BALANCE));

  return { crescite, staking, account1, whaleAccount, signers };
}

// ------------------------------------------------------

describe('big()', () => {
  it('should convert an integer to a BigNumber of precision 1e18', () => {
    expect(big(100) instanceof ethers.BigNumber).to.be.true;
    expect(big(100).toString()).to.eq('100000000000000000000');
  })
});

// ------------------------------------------------------

/**
 * Test the Staking contract
 */
describe('Staking', () => {
  describe('Ownership', () => {
    it('should be owned by the deploy address', async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(account1);

      expect(await stakingContract.testViewOwner()).to.eq(account1.address);
    });
  });

  it('should revert if amount is 0', async () => {
    const { staking } = await loadFixture(deployFixtures);

    await expect(staking.stakeTokens(0)).to.be.revertedWith('Amount must be greater than zero');
  });

  it('should stake tokens', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    expect(crescite.allowance(staking.address, account1.address)).eventually.to.equal(0);

    // approve the contract to 'spend' CRE
    await crescite.connect(account1).approve(staking.address, big(1000));
    await staking.connect(account1).stakeTokens(big(1000));

    expect(staking.userStakingTotals(account1.address)).eventually.to.equal(big(1000));
    expect(crescite.balanceOf(account1.address)).eventually.to.equal(big(1000));
  });

  it('should store multiple staking positions per user', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    // approve the contract to 'spend' CRE
    await crescite.connect(account1).approve(staking.address, big(2000));

    const Staking = await staking.connect(account1);

    Staking.stakeTokens(big(1000));

    expect(staking.userStakingTotals(account1.address)).eventually.to.equal(big(1000));
    expect(crescite.balanceOf(account1.address)).eventually.to.equal(big(1000));

    await Staking.stakeTokens(big(1000));

    expect(staking.userStakingTotals(account1.address)).eventually.to.equal(big(2000));
    expect(crescite.balanceOf(account1.address)).eventually.to.equal(0);
  });

  it('should keep count of all tokens staked', async () => {
    const { crescite, staking, account1, whaleAccount } = await loadFixture(deployFixtures);

    await crescite.connect(account1).approve(staking.address, big(2000));
    await crescite.connect(whaleAccount).approve(staking.address, big(2000));

    await staking.connect(account1).stakeTokens(big(1000));
    expect(staking.totalStaked()).eventually.to.equal(big(1000));

    await staking.connect(whaleAccount).stakeTokens(big(500));
    expect(staking.totalStaked()).eventually.to.equal(big(1500));

    await staking.connect(account1).unstakeTokens();
    expect(staking.totalStaked()).eventually.to.equal(big(500));

    await staking.connect(whaleAccount).unstakeTokens();
    expect(staking.totalStaked()).eventually.to.equal(0);
  });

  it('should revert if insufficient balance to stake requested amount', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    // approve the contract to 'spend' all the CRE tokens minted to account1
    await crescite
      .connect(account1)
      .approve(staking.address, big(2000));

    await expect(
      staking
        .connect(account1)
        .stakeTokens(big(2001))
    ).to.be.revertedWith('Insufficient token balance')
  });

  it('should revert if staking pool is full for current year', async () => {
    const { crescite, staking, whaleAccount } = await loadFixture(deployFixtures);

    // just approve a very high number for spending
    await crescite.connect(whaleAccount).approve(staking.address, big(10_000_000_000));
    const stakingContract = await staking.connect(whaleAccount);

    // --------------------------------------
    // Fill up the staking pool for the 1st year
    // First year limit is 500_000_000
    await stakingContract.stakeTokens(big(500_000_000));

    // stake one more token, should be rejected
    await expect(stakingContract.stakeTokens(big(1))
    ).to.be.revertedWith('Staking pool limit reached');

    // --------------------------------------
    // now move on to the second year
    await nextBlockIsOneYearLater();

    // stake one token a year later, should be fine
    await expect(stakingContract.stakeTokens(big(1))
    ).not.to.be.revertedWith('Staking pool limit reached');

    // Now fill up the remaining allowance for the 2nd year
    // (500_000_001 of 2nd year limit 1_500_000_000 has been staked)
    // (so 999_999_999 is the remaining allowance)
    await expect(stakingContract.stakeTokens(big(999_999_999))
    ).not.to.be.revertedWith('Staking pool limit reached');

    // Now try and stake one more token, should be rejected
    await expect(stakingContract.stakeTokens(big(1))
    ).to.be.revertedWith('Staking pool limit reached');

    // --------------------------------------
    // Now move in to the third year
    // The staking limit is 3_000_000_000
    await nextBlockIsOneYearLater();

    // stake one token another year later, should be fine
    await expect(stakingContract.stakeTokens(big(1))
    ).not.to.be.revertedWith('Staking pool limit reached');

    // Now fill up the third year staking pool
    // 1_500_000_001 has been staked so far
    await expect(stakingContract.stakeTokens(big(1_499_999_999))
    ).not.to.be.revertedWith('Staking pool limit reached');

    await time.increase(ONE_DAY);

    // Now try and stake one more token, should be rejected
    // since the third year limit has been reached
    await expect(stakingContract.stakeTokens(big(1))
    ).to.be.revertedWith('Staking pool limit reached');

    // Now move into the fourth year, everything should be the same
    await mineBlockOneYearLater();

    // Now try and stake one more token, should be rejected
    // since the third year limit has been reached
    await expect(stakingContract.stakeTokens(big(1))
    ).to.be.revertedWith('Staking pool limit reached');
  });

  it('should allow staking of full account balance', async () => {
    const { crescite, staking, account1 } = await loadFixture(deployFixtures);

    // approve the contract to 'spend' all the CRE tokens minted to account1
    await crescite.connect(account1).approve(staking.address, big(2000));

    await staking.connect(account1).stakeTokens(big(2000));

    expect(staking.userStakingTotals(account1.address)).eventually.to.equal(big(2000));
    expect(crescite.balanceOf(account1.address)).eventually.to.equal(0);
  });

  it('should count the number of stakers', async () => {
    const { crescite, staking, account1, whaleAccount } = await loadFixture(deployFixtures);

    crescite.connect(account1).approve(staking.address, big(2000));
    crescite.connect(whaleAccount).approve(staking.address, big(2000));

    const staking1 = staking.connect(account1);
    const staking2 = staking.connect(whaleAccount);

    await staking1.stakeTokens(big(1000));
    expect(staking.numberOfStakers()).eventually.to.equal(1);

    await staking2.stakeTokens(big(1000));
    expect(staking.numberOfStakers()).eventually.to.equal(2);

    await staking1.stakeTokens(big(1000));
    expect(staking.numberOfStakers()).eventually.to.equal(2);

    await staking2.stakeTokens(big(1000));
    expect(staking.numberOfStakers()).eventually.to.equal(2);

    await staking1.unstakeTokens();
    expect(staking.numberOfStakers()).eventually.to.equal(1);

    await staking2.unstakeTokens();
    expect(staking.numberOfStakers()).eventually.to.equal(0);
  });

  describe('unstakeTokens()', () => {
    let Staking: StakingTestHarness;
    let Crescite: Crescite;
    let account1: SignerWithAddress;
    let whaleAccount: SignerWithAddress;

    beforeEach(async () => {
      const data = await loadFixture(deployFixtures);

      account1 = data.account1;
      whaleAccount = data.whaleAccount;

      Staking = data.staking;
      Crescite = data.crescite;

      // approve the contract to spend CRE
      await Crescite.connect(account1).approve(Staking.address, big(2000));
      await Crescite.connect(whaleAccount).approve(Staking.address, big(20000000));
    })

    /**
     * Create a scenario where the given number of tokens are
     * staked for exactly one year, then unstaked.
     * Return the expected balance after unstaking and the actual balance.
     *
     * @param amountToStake
     */
    function getExpectedBalance(amountToStake: number) {
      const expectedRewards = amountToStake * APR / 100;
      return big(NORMAL_ACCOUNT_STARTING_BALANCE + expectedRewards);
    }

    /**
     * Create a scenario where the given number of tokens are
     * staked for exactly one year, then unstaked.
     *
     * Return the expected balance after unstaking and the actual balance.
     *
     * @param tokenQuantity Amount of CRE to stake
     * @param account SignerWithAddress calling account
     * @return {Promise<{expectedBalance: BigNumber, actualBalance: BigNumber}>}
     */
    async function stakeAndClaim(tokenQuantity: number, account: SignerWithAddress) {
      const address = account.address;
      const amountToStake = big(tokenQuantity);
      const startingBalance = await Crescite.balanceOf(address);
      const connectedStakingContract = Staking.connect(account);

      log(`\tStarting balance ${ethers.utils.formatEther(startingBalance)}`);

      if (amountToStake.gt(startingBalance)) {
        throw new Error(`Insufficient balance to stake (balance ${startingBalance}, stake ${amountToStake})`);
      }

      // stake tokens
      await connectedStakingContract.stakeTokens(amountToStake);
      const stakeTimestamp = await getLatestBlockTimestamp();

      // fake a staking duration of one year
      await nextBlockIsOneYearLater();

      // unstake the tokens
      await connectedStakingContract.unstakeTokens();
      const unstakeTimestamp = await getLatestBlockTimestamp();

      // check the elapsed time is correct
      expect(unstakeTimestamp - stakeTimestamp).to.eq(ONE_YEAR);

      // get the actual balance after unstaking
      const balanceAfterUnstaking = await Crescite.balanceOf(address);

      log(`\tBalance after staking ${tokenQuantity} for 1 year ${ethers.utils.formatEther(balanceAfterUnstaking)}`);

      // return values for comparison inside the test
      return balanceAfterUnstaking;
    }

    /**
     * Starting balances:
     * account1: 2000 CRE
     * whaleAccount: 20,000,000 CRE
     */
    it('should transfer original stake plus rewards to user', async () => {
      const amountToStake = 1000;
      const balanceAfterUnstaking = await stakeAndClaim(amountToStake, account1);

      expect(balanceAfterUnstaking).to.eq(getExpectedBalance(amountToStake));
    });

    it('should work for small amounts of staked token', async () => {
      const amountToStake = 1.5;
      const balanceAfterUnstaking = await stakeAndClaim(1.5, account1);

      expect(balanceAfterUnstaking).to.eq(getExpectedBalance(amountToStake));
    });

    it('should work for very precise amounts of staked token', async () => {
      const amountToStake = 100.123456789012345;
      const balanceAfterUnstaking = await stakeAndClaim(amountToStake, account1);

      // hardcode this expected balance, more precision required than JS can handle
      expect(ethers.utils.formatEther(balanceAfterUnstaking)).to.eq('2012.014814814681482');
    });

    it('should work for very large amounts of staked tokens', async () => {
      const balanceAfterUnstaking = await stakeAndClaim(10_000_000, whaleAccount);
      expect(Number(ethers.utils.formatEther(balanceAfterUnstaking))).to.eq(4_001_200_000);
    });
  });

  describe('calculatePositionRewards()', () => {
    async function calculateRewardsForOneYear(amount: number) {
      const { staking, account1 } = await loadFixture(deployFixtures);

      const stakingContract = staking.connect(account1);

      const fakeStakingTimestamp = await time.latest();
      await time.increaseTo(fakeStakingTimestamp + (ONE_YEAR));

      const rewards = await stakingContract
        .connect(account1)
        .testCalculatePositionRewards(big(amount), fakeStakingTimestamp);

      return ethers.utils.formatEther(rewards);
    }

    it('should calculate rewards for a given position', async () => {
      expect(await calculateRewardsForOneYear(1000)).to.eq('120.0');
      expect(await calculateRewardsForOneYear(100)).to.eq('12.0');
      expect(await calculateRewardsForOneYear(1)).to.eq('0.12');

      expect(await calculateRewardsForOneYear(1000.123456789012345)).to.eq('120.014814814681488');
      expect(await calculateRewardsForOneYear(0.00001)).to.eq('0.0000012');
    });
  });

  describe('viewUserStakingRewards()', () => {
    it('should return rewards accrued to date for the given address', async () => {
      const { staking, account1, crescite } = await loadFixture(deployFixtures);

      // approve the staking contract to spend 1000 CRE
      await crescite.connect(account1).approve(staking.address, big(1000));

      // stake 1000 CRE
      const stakingContract = staking.connect(account1);
      await stakingContract.stakeTokens(big(1000));

      await time.increaseTo((await time.latest()) + ONE_YEAR);

      const actual = await stakingContract.viewUserStakingRewards(account1.address);

      expect(ethers.utils.formatEther(actual)).to.eq('120.0');
    })
  });

  describe('viewUserRewardsPerSecond()', () => {
    it('should return rewards per second based on user staking positions', async () => {
      const { staking, account1, crescite } = await loadFixture(deployFixtures);

      // approve the staking contract to spend 1000 CRE
      await crescite.connect(account1).approve(staking.address, big(1000));

      // stake 1000 CRE
      const stakingContract = staking.connect(account1);
      await stakingContract.stakeTokens(big(1000));

      const actual = await stakingContract.viewUserRewardsPerSecond(account1.address);
      expect(ethers.utils.formatEther(actual)).to.eq('0.000003805175038052');
    });
  });

  describe('viewStakeLimit()', () => {
    it('should return staking limit according to current year of contract', async () => {
      const { staking } = await loadFixture(deployFixtures);

      const limit = await staking.viewStakeLimit();
      expect(formatEther(limit)).to.eq('500000000.0');

      await mineBlockOneYearLater();
      await expect(formatEther(await staking.viewStakeLimit())).to.eq('1500000000.0');

      await mineBlockOneYearLater();
      await expect(formatEther(await staking.viewStakeLimit())).to.eq('3000000000.0');

      const lastBlockTime = await getLatestBlockTimestamp();
      await time.increaseTo(lastBlockTime + ONE_YEAR * 35);
      await expect(formatEther(await staking.viewStakeLimit())).to.eq('3000000000.0');
    });
  })

  describe('getCurrentYear()', () => {
    let stakingContract: StakingTestHarness;
    let startDate: number;

    // Utility function to increase the block timestamp
    async function increaseTimeBy(amount: number) {
      return await time.increaseTo(startDate + amount);
    }

    beforeEach(async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      stakingContract = staking.connect(account1);

      startDate = (await stakingContract.START_DATE()).toNumber();
    });

    // Test scenarios
    it('should return current year as 1 on 1 day after start timestamp', async function () {
      await increaseTimeBy(ONE_DAY);
      expect(await stakingContract.testGetCurrentYear()).to.equal(1);
    });

    it('should return current year as 1 on 365 days after start timestamp (1 second before midnight)', async function () {
      await increaseTimeBy(ONE_YEAR - 1);
      expect(await stakingContract.testGetCurrentYear()).to.equal(1);
    });

    it('should return current year as 2 on the first day of the second year', async function () {
      await increaseTimeBy(ONE_YEAR);
      expect(await stakingContract.testGetCurrentYear()).to.equal(2);
    });

    it('should return current year as 10 on the first day of the tenth year', async function () {
      await increaseTimeBy(ONE_YEAR * 10 - 1);
      expect(await stakingContract.testGetCurrentYear()).to.equal(10);
    });

    it('should return current year as 38 on the first day of the thirty-eighth year', async function () {
      await increaseTimeBy(ONE_YEAR * 38 - 1);
      expect(await stakingContract.testGetCurrentYear()).to.equal(38);
    });

    it('should return current year as 39 on the first day of the thirty-ninth year', async function () {
      await increaseTimeBy(ONE_YEAR * 39 - 1);
      expect(await stakingContract.testGetCurrentYear()).to.equal(39);
    });
  });

  describe('getCurrentOrEndTime()', () => {
    it('should return the current time when it is before END_DATE', async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(account1);

      const endDate = (await stakingContract.END_DATE()).toString();
      const fakeCurrentDate = BigInt(endDate) - BigInt(1);

      await time.increaseTo(fakeCurrentDate);

      expect((await stakingContract.testGetCurrentOrEndTime()).toString()).to.equal(fakeCurrentDate);
    });

    it('should return END_DATE when current time is after END_DATE', async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(account1);

      const endDate = (await stakingContract.END_DATE()).toString();
      const fakeCurrentDate = BigInt(endDate) + BigInt(1);

      await time.increaseTo(fakeCurrentDate);

      expect((await stakingContract.testGetCurrentOrEndTime()).toString()).to.equal(endDate);
    });
  });

  describe('pause()', () => {
    it('should pause contract', async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(account1);

      await stakingContract.pause();

      await expect(stakingContract.stakeTokens(100)).to.be.revertedWith('Pausable: paused');
    });

    it('should only be callable by contract owner', async () => {
      const { staking, whaleAccount } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(whaleAccount);

      await expect(stakingContract.pause()).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should revert if already paused', async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(account1);

      await stakingContract.pause();
      await expect(stakingContract.pause()).to.be.revertedWith('Pausable: paused');
    });
  });

  describe('resume()', () => {
    it('should un-pause contract', async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(account1);

      await stakingContract.pause();
      await expect(stakingContract.stakeTokens(100)).to.be.revertedWith('Pausable: paused');

      await stakingContract.resume();
      await expect(stakingContract.stakeTokens(100)).not.to.be.revertedWith('Pausable: paused');
    });

    it('should not resume if contract is not paused', async () => {
      const { staking, account1 } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(account1);

      await expect(stakingContract.resume()).to.be.revertedWith('Pausable: not paused');
    });

    it('should only be callable by contract owner', async () => {
      const { staking, whaleAccount } = await loadFixture(deployFixtures);
      const stakingContract = staking.connect(whaleAccount);

      await expect(stakingContract.resume()).to.be.revertedWith('Ownable: caller is not the owner');
    });
  })
});
