// SPDX-License-Identifier: GNU
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./Crescite.sol";
import "./lib/ds-math/math.sol";

contract Staking is DSMath, Context, ReentrancyGuard, Ownable {
  Crescite public token;

  struct StakingPosition {
    uint256 amount;
    uint256 timestamp;
  }

  uint256 public totalStaked = 0;
  uint256 public numberOfStakers = 0;
  uint256 public START_DATE;
  uint256 public END_DATE;

  uint256 private APR = 12;
  uint256 private constant PRECISION = 1e18;
  uint256 private constant SECONDS_IN_YEAR = 365 days;
  bool private IS_PAUSED = false;

  uint256 public constant YEAR_1_LIMIT = 500_000_000 * PRECISION;
  uint256 public constant YEAR_2_LIMIT = 1_500_000_000 * PRECISION;
  uint256 public constant YEARLY_LIMIT = 3_000_000_000 * PRECISION;


  mapping(address => StakingPosition[]) public stakingPositions;
  mapping(address => uint256) public userStakingTotals;

  event Staked(address indexed user, uint256 amount);
  event Unstaked(address indexed user, uint256 amount, uint256 rewards);

  constructor(address tokenAddress, uint256 apr) {
    START_DATE = block.timestamp;
    END_DATE = START_DATE + 365 days * 38;

    token = Crescite(tokenAddress);
    APR = apr;
  }

  /**
   * @notice Stake tokens
   * @param amount The amount of tokens to stake
   * @dev The user must approve the staking contract to transfer tokens before calling this function
   * @dev The user must have enough tokens to stake
   * @dev A user can stake multiple times, each time will create a new staking position
   */
  function stakeTokens(uint256 amount) external nonReentrant {
//    console.log('Staking:', add(totalStaked, amount), getStakeLimit());

    require(IS_PAUSED == false, "Staking is paused");
    require(amount > 0, "Amount must be greater than zero");
    require(token.balanceOf(_msgSender()) >= amount, "Insufficient token balance");
    require(add(totalStaked, amount) <= getStakeLimit(), "Staking pool limit reached");

    address user = _msgSender();

    // Transfer tokens from user to staking contract
    token.transferFrom(user, address(this), amount);

    // Create a new staking position for the amount and block timestamp
    stakingPositions[user].push(StakingPosition(amount, block.timestamp));

    // Update user's total staked amount
    userStakingTotals[user] = add(userStakingTotals[user], amount);

    // Update global total staking balance
    totalStaked = add(totalStaked, amount);

    // if first position opened by this user then count them
    if (stakingPositions[user].length == 1) {
      numberOfStakers = add(numberOfStakers, 1);
    }

    emit Staked(user, amount);
  }

  /**
   * @notice Calculate the rewards for a staking position
   * @dev Rewards are calculated based on the elapsed time for each staking position held by the user
   * @dev Rewards are calculated based on the APR and the amount staked
   */
  function unstakeTokens() external nonReentrant {
    require(IS_PAUSED == false, "Unstaking is paused");
    require(stakingPositions[_msgSender()].length > 0, "No staking positions");

    address user = _msgSender();
    uint256 amountStaked = userStakingTotals[user];
    uint256 rewards = 0;

    // Calculate the total rewards from the user's staking staking positions
    // Calculate total staked amount and rewards
    for (uint256 i = 0; i < stakingPositions[user].length; i++) {
      uint256 amount = stakingPositions[user][i].amount;
      uint256 timestamp = stakingPositions[user][i].timestamp;

      rewards = add(rewards, calculatePositionRewards(amount, timestamp));
    }

    // Remove user's staking entry
    delete stakingPositions[user];

    // Subtract amount from the user's staked total
    userStakingTotals[user] = sub(userStakingTotals[user], amountStaked);

    // Subtract user's stake from the grand total
    totalStaked = sub(totalStaked, amountStaked);

    // decrement the number of stakers
    numberOfStakers = sub(numberOfStakers, 1);

    // Transfer staked tokens from staking contract back to user
    // only *after* zeroing their staked balance to help minimise attack vector
    // @see https://consensys.io/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
    token.transfer(user, add(amountStaked, rewards));

    emit Unstaked(user, amountStaked, rewards);
  }

  /**
   * @notice Calculate the rewards for a given staking position based on the elapsed time and APR.
   * @param positionAmount The amount of tokens staked.
   * @param positionTimestamp The timestamp when the stake was made.
   * @return The calculated rewards based on the elapsed time and APR.
   */
  function calculatePositionRewards(uint256 positionAmount, uint256 positionTimestamp) internal view returns (uint256) {
    // calculate the rewards for a year from the position amount
    uint256 rewardsPerYear = wmul(positionAmount, wdiv(wmul(APR, PRECISION), wmul(100, PRECISION)));

    // then calculate the rewards per second for this position
    uint256 rewardsPerSecond = wdiv(rewardsPerYear, wmul(SECONDS_IN_YEAR, PRECISION));

    // Calculate the time elapsed since the position was opened
    uint256 elapsedSeconds = sub(getCurrentOrEndTime(), positionTimestamp);

    // Calculate the rewards based on the elapsed time and rewards per second
    uint256 reward = wmul(rewardsPerSecond, wmul(elapsedSeconds, PRECISION));

//    console.log('[Staking] positionAmount', positionAmount);
//    console.log('[Staking] rewardsPerYear', rewardsPerYear);
//    console.log('[Staking] rewardsPerSecond', rewardsPerSecond);
//    console.log('[Staking] elapsedSeconds', elapsedSeconds);
//    console.log('[Staking] rewards in wei', reward);

    // Return the calculated rewards
    return reward;
  }

  /**
   *
   */
  function viewUserStakingRewards(address user) external view returns (uint256) {
    require(stakingPositions[user].length > 0, "No staking positions");

    uint256 rewards = 0;

    for (uint256 i = 0; i < stakingPositions[user].length; i++) {
      uint256 amount = stakingPositions[user][i].amount;
      uint256 timestamp = stakingPositions[user][i].timestamp;

      rewards = add(rewards, calculatePositionRewards(amount, timestamp));
    }

    return rewards;
  }

  /**
   *
   */
  function viewUserRewardsPerSecond(address user) external view returns (uint256) {
    require(userStakingTotals[user] > 0, "No staking positions");

    uint256 rewardsPerYear = wmul(userStakingTotals[user], wdiv(mul(APR, PRECISION), mul(100, PRECISION)));
    uint256 rewardsPerSecond = wdiv(rewardsPerYear, mul(SECONDS_IN_YEAR, PRECISION));

    return rewardsPerSecond;
  }

  function viewApr() external view returns (uint256) {
    return APR;
  }

  function viewStakeLimit() external view returns (uint256) {
    return getStakeLimit();
  }

  /**
   * It should return the lesser of block.timestamp and END_DATE
   *
   * @notice Get the current time (block timestamp).
   * @return The current time.
   */
  function getCurrentOrEndTime() internal view returns (uint256) {
    if (block.timestamp > END_DATE) {
      return END_DATE;
    } else {
      return block.timestamp;
    }
  }

  /**
   * @dev Get the stake limit based on the current year.
   * @return The stake limit for the current year.
   */
  function getStakeLimit() internal view returns (uint256) {
    uint256 currentYear = getCurrentYear();

    if (currentYear == 1) {
      return YEAR_1_LIMIT;
    } else if (currentYear == 2) {
      return YEAR_2_LIMIT;
    } else {
      return YEARLY_LIMIT;
    }
  }

  /**
   * @dev Get the current year based on the contract start date and current time.
   * @return The current year.
   */
  function getCurrentYear() internal view returns (uint256) {
    uint256 elapsedTime = sub(block.timestamp, START_DATE);

    // Assuming 1 year is 31536000 seconds, add 1 to start the year count from 1.
    uint256 currentYear = add(1, (elapsedTime / SECONDS_IN_YEAR));
    return currentYear;
  }

  /**
   * Calling this function sets a flag which will prevent
   * staking/unstaking calls
   */
  function pause() external onlyOwner {
    require(IS_PAUSED == false, "Contract is already paused");

    IS_PAUSED = true;
  }

  /**
   * Calling this function sets a flag which will prevent
   * staking/unstaking calls
   */
  function resume() external onlyOwner {
    require(IS_PAUSED == true, "Contract is not paused");

    IS_PAUSED = false;
  }
}

