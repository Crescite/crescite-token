// SPDX-License-Identifier: GNU
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
import "./Crescite.sol";
import "./lib/ds-math/math.sol";

contract Staking is DSMath {
  Crescite public token;

  struct StakingPosition {
    uint256 amount;
    uint256 timestamp;
  }

  uint256 public totalStaked = 0;
  uint256 public numberOfStakers = 0;
  uint256 public START_DATE;
  uint256 private constant PRECISION = 1e18;
  uint256 private constant APR = 12;
  uint256 private constant SECONDS_IN_YEAR = 365 days;

  mapping(address => StakingPosition[]) public stakingPositions;
  mapping(address => uint256) public userStakingTotals;

  event Staked(address indexed user, uint256 amount);
  event Unstaked(address indexed user, uint256 amount);

  constructor(address tokenAddress) {
    START_DATE = block.timestamp;
    token = Crescite(tokenAddress);
  }

  /**
   * @notice Stake tokens
   * @param amount The amount of tokens to stake
   * @dev The user must approve the staking contract to transfer tokens before calling this function
   * @dev The user must have enough tokens to stake
   * @dev A user can stake multiple times, each time will create a new staking position
   */
  function stakeTokens(uint256 amount) public {
    require(amount > 0, "Amount must be greater than zero");
    require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");

    address user = msg.sender;

    console.log('[Crescite] precision', token.decimals());
    console.log('[Staking] transfer to contract', amount);

    // Transfer tokens from user to staking contract
    token.transferFrom(user, address(this), amount);

    console.log('[Staking] New position', amount, block.timestamp);

    // Create a new staking position for the amount and block timestamp
    stakingPositions[user].push(StakingPosition(amount, block.timestamp));

    // Update user's total staked amount
    userStakingTotals[user] = add(userStakingTotals[user], amount);

    // Update global total staking balance
    totalStaked = add(totalStaked, amount);

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
  function unstakeTokens() public {
    require(stakingPositions[msg.sender].length > 0, "No staking positions");

    address user = msg.sender;
    uint256 amountStaked = userStakingTotals[user];
    uint256 rewards = 0;

    // Calculate the total rewards from the user's staking staking positions
    // Calculate total staked amount and rewards
    for (uint256 i = 0; i < stakingPositions[msg.sender].length; i++) {
      uint256 amount = stakingPositions[msg.sender][i].amount;
      uint256 timestamp = stakingPositions[msg.sender][i].timestamp;

      rewards = add(rewards, calculatePositionRewards(amount, timestamp));
    }

    // Transfer staked tokens from staking contract back to user
    // TODO is this already actually denominated in Wei ?
    // TODO Check Metamask is showing correct amounts
    token.transfer(user, add(amountStaked, rewards));

    // Remove user's staking entry
    delete stakingPositions[user];

    // Subtract amount from the user's staked total
    userStakingTotals[user] = sub(userStakingTotals[user], amountStaked);

    // Subtract user's stake from the grand total
    totalStaked = sub(totalStaked, amountStaked);

    // decrement the number of stakers
    numberOfStakers = sub(numberOfStakers, 1);

    emit Unstaked(user, amountStaked);
  }

  /**
   * @notice Get the total amount of tokens staked by a user.
   */
  function getUserStake(address user) internal view returns (uint256) {
    uint256 amount = 0;

    for (uint256 i = 0; i < stakingPositions[user].length; i++) {
      amount += stakingPositions[user][i].amount;
    }

    return amount;
  }

  /**
   * @notice Calculate the rewards for a given staking position based on the elapsed time and APR.
   * @param positionAmount The amount of tokens staked.
   * @param positionTimestamp The timestamp when the stake was made.
   * @return The calculated rewards based on the elapsed time and APR.
   */
  function calculatePositionRewards(uint256 positionAmount, uint256 positionTimestamp) internal view returns (uint256) {
    // calculate the rewards for a year from the position amount
    uint256 rewardsPerYear = wmul(positionAmount * PRECISION, wdiv(APR * PRECISION, 100 * PRECISION));

    // then calculate the rewards per second for this position
    uint256 rewardsPerSecond = wdiv(rewardsPerYear, SECONDS_IN_YEAR * PRECISION);

    // Calculate the time elapsed since the position was opened
    uint256 elapsedSeconds = sub(getCurrentTime(), positionTimestamp);

    // Calculate the rewards based on the elapsed time and rewards per second
    uint256 reward = wmul(rewardsPerSecond, elapsedSeconds * PRECISION);

    console.log('[Staking] positionAmount', positionAmount);
    console.log('[Staking] rewardsPerYear', rewardsPerYear);
    console.log('[Staking] rewardsPerSecond', rewardsPerSecond);
    console.log('[Staking] rewards in wei', reward);

    // TODO return value in Wei and then modify the transfer?
    // TODO this doesn't work for small reward values, just returns 0
    // Return the calculated rewards
    return reward;
  }

  /**
   * @notice Get the current year based on the contract start date and current time.
   * @return The current year.
  function getCurrentYear() internal view returns (uint256) {
    uint256 currentTime = getCurrentTime();
    uint256 elapsedYears = (currentTime - START_DATE) / YEAR_IN_SECONDS;

    return elapsedYears + 1;
  }
   */

  /**
   * @notice Get the current time (block timestamp).
   * @return The current time.
   */
  function getCurrentTime() internal view returns (uint256) {
    return block.timestamp;
  }

}

