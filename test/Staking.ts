import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { Crescite, Staking } from '../typechain-types';
import { areWithinTolerance } from './util/are-within-tolerance';
import { log } from './util/log';

// ------------------------------------------------------

/**
 * Constants
 */
const ONE_DAY = 86_400;
const ONE_YEAR = ONE_DAY * 365;

// ------------------------------------------------------

/**
 * Utility functions
 */
async function advanceOneYear() {
  const lastBlockTime = await time.latest();

  return await time.setNextBlockTimestamp(lastBlockTime + ONE_YEAR);
}

async function getLatestTimestamp() {
  return await time.latest();
}

/**
 * Convert given value to a BigNumber with precision 1e18
 */
function big(intValue: number): BigNumber {
  return ethers.BigNumber.from(BigInt(intValue * 1e18));
}

/**
 * See Staking.sol#calculatePositionRewards() for original calculation
 *
 * Due to slight differences in the way the timestamp is calculated
 * in DSMath Solidity library and ethers.BigNumber, the results are not
 * always *precisely* the same. They are however within a tolerance.
 *
 * When using this function always also use the areWithinTolerance() utility
 * to check the calculated expected result is within the tolerance of the actual result
 * calculated by the Staking contract.
 *
 * @param positionAmount Size of staking position
 * @param positionTimestamp Timestamp of position
 * @param lastBlockTimestamp Timestamp of block at which rewards are calculated
 */
function calculateExpectedRewards(positionAmount: BigNumber, positionTimestamp: number, lastBlockTimestamp: number): BigNumber {
  const rewardsPerYear = positionAmount.mul(12).div(100);
  const rewardsPerSecond = rewardsPerYear.div(ONE_YEAR);
  const elapsedSeconds = lastBlockTimestamp - positionTimestamp;

  // console.log('positionTimestamp', positionTimestamp);
  // console.log('lastBlockTimestamp', lastBlockTimestamp);
  // console.log('elapsedSeconds', elapsedSeconds);

  const reward = rewardsPerSecond.mul(elapsedSeconds);
  return reward;
}

// ------------------------------------------------------

/**
 * Deploy the Crescite and Staking contracts and mint some CRE tokens
 */
async function deployFixtures() {
  const crescite = await ethers.deployContract('Crescite') as Crescite;
  const staking = await ethers.deployContract('StakingTestHarness', [crescite.address]) as Staking;

  // see util/get-hardhat-user-config.ts for the config
  // of the three accounts to be used as signers
  const signers = await ethers.getSigners();

  const account1 = signers[0]
  const whaleAccount = signers[1];

  // regular account holds 2000 CRE
  await crescite.mint(account1.address, big(2000));

  // whale account holds 20 million CRE
  await crescite.mint(whaleAccount.address, big(20000000));

  // staking contract holds 100 million CRE
  await crescite.mint(staking.address, big(100000000));

  return { crescite, staking, account1, whaleAccount, signers };
}

// ------------------------------------------------------

describe('Utilities', () => {
  describe('calculateExpectedRewards()', () => {
    it('should calculate rewards exactly as the Staking contract', () => {
      const positionAmount = big(1000);

      const positionTimestamp = 1689759403;
      const lastBlockTimestamp = 1721295404;

      const actual = calculateExpectedRewards(positionAmount, positionTimestamp, lastBlockTimestamp);
      const expected = big(120);

      expect(areWithinTolerance(actual, expected)).to.be.true;
    });
  });

  describe('big()', () => {
    it('should convert an integer to a BigInt of precision 1e18', () => {
      expect(big(100).toString()).to.eq('100000000000000000000');
    })
  });
})

// ------------------------------------------------------

/**
 * Test the fixtures
 */
describe('Fixtures', () => {
  it('should mint around 120 million CRE', async () => {
    const { crescite } = await loadFixture(deployFixtures);

    const totalSupply = await crescite.totalSupply()
    const creValueWithoutDecimals = totalSupply.div(ethers.BigNumber.from(10).pow(18));

    expect(creValueWithoutDecimals).to.equal(120002000);
  })
});

// ------------------------------------------------------

/**
 * Test the Staking contract
 */
describe('Staking', () => {
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

  it('should allow stake more than once', async () => {
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

  it('should maintain count of total tokens staked by all users', async () => {
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

  it('should revert if insufficient balance', async () => {
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
    let Staking: Staking;
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

      if(amountToStake.gt(startingBalance)) {
        throw new Error(`Insufficient balance to stake (balance ${startingBalance}, stake ${amountToStake})`);
      }

      // stake tokens
      await connectedStakingContract.stakeTokens(amountToStake);
      const stakeTimestamp = await getLatestTimestamp();

      // move the chain forward one year
      await advanceOneYear();

      // unstake the tokens
      await connectedStakingContract.unstakeTokens();
      const unstakeTimestamp = await getLatestTimestamp();

      // calculate the expected rewards
      const rewards = calculateExpectedRewards(amountToStake, stakeTimestamp, unstakeTimestamp);

      // calculate the expected balance after unstaking
      const expectedBalance = startingBalance.add(rewards);

      // get the actual balance after unstaking
      const actualBalance = await Crescite.balanceOf(address);

      // return values for comparison inside the test
      return { expectedBalance, actualBalance };
    }

    it('should transfer original stake plus rewards to user', async () => {
      log(`\tStarting balance ${await Crescite.balanceOf(account1.address)}`);

      const { expectedBalance, actualBalance } = await stakeAndClaim(1000, account1);

      log(`\tBalance after staking ${await Crescite.balanceOf(account1.address)}`);

      expect(areWithinTolerance(expectedBalance, actualBalance)).to.be.true;
    });

    it('should work for small amounts of staked token', async () => {
      const { expectedBalance, actualBalance } = await stakeAndClaim(1.5, account1);
      expect(areWithinTolerance(expectedBalance, actualBalance)).to.be.true;
    });

    it('should work for very precise amounts of staked token', async () => {
      const { expectedBalance, actualBalance } = await stakeAndClaim(100.123456789012345, account1);
      expect(areWithinTolerance(expectedBalance, actualBalance)).to.be.true;
    });

    it('should work for very large amounts of staked tokens', async () => {
      const { expectedBalance, actualBalance } = await stakeAndClaim(10000000, whaleAccount);
      expect(areWithinTolerance(expectedBalance, actualBalance)).to.be.true;
    });
  })

});
