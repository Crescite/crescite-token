// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../math/DSMath.sol";

/**
 * Usage: inherit from this contract and create an initialize() function, e.g.:
 *
 * function initialize(address tokenAddress, uint apr) public initializer {
 *    __Staking_init();
 *    _setToken(Crescite(tokenAddress));
 *    _setAPR(apr);
 *  }
 */
abstract contract StakingUpgradeable is
  Initializable,
  DSMath,
  ContextUpgradeable,
  OwnableUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  using Counters for Counters.Counter;

  struct StakingPosition {
    uint256 amount;
    uint256 timestamp;
  }

  address private _tokenAddress;
  uint256 private APR;

  uint256 private PRECISION;
  uint256 private SECONDS_IN_YEAR;

  uint256 private YEAR_1_LIMIT;
  uint256 private YEAR_2_LIMIT;
  uint256 private YEARLY_LIMIT;

  Counters.Counter private _numberOfStakers;

  uint256 public totalStaked;
  uint256 public START_DATE;
  uint256 public END_DATE;

  mapping(address => StakingPosition[]) public stakingPositions;
  mapping(address => uint256) public userStakingTotals;
  mapping(address => uint256) public userPositionCount;

  uint256[50] private __gap;

  event Staked(address indexed user, uint256 amount);
  event Unstaked(address indexed user, uint256 amount, uint256 rewards);
  event ClaimRewards(address indexed user, uint256 rewards);
  event WithdrawFunds(address indexed user, uint256 amount);

  function __Staking_init() internal onlyInitializing {
    __Staking_init_unchained();
  }

  function __Staking_init_unchained() internal onlyInitializing {
    __Context_init();
    __Ownable_init();
    __Pausable_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    PRECISION = 1e18;

    // average days per year (due to leap years)
    SECONDS_IN_YEAR = 365.25 days;

    START_DATE = block.timestamp;
    END_DATE = START_DATE + SECONDS_IN_YEAR * 38;

    YEAR_1_LIMIT = 500_000_000 * PRECISION;
    YEAR_2_LIMIT = 1_500_000_000 * PRECISION;
    YEARLY_LIMIT = 3_000_000_000 * PRECISION;

    totalStaked = 0;
  }

  /**
   * @dev https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable
   *
   * "The _authorizeUpgrade function must be overridden to
   * include access restriction to the upgrade mechanism."
   */
  function _authorizeUpgrade(address) internal override onlyOwner {}

  /**
   * --------------------------------------------
   * Initial setter functions, call these from initializer() function
   * --------------------------------------------
   */
  function _setToken(address tokenAddress) internal onlyOwner {
    _tokenAddress = tokenAddress;

  }

  function _setAPR(uint apr) internal onlyOwner {
    APR = apr;
  }

  /**
   * --------------------------------------------
   * Modifiers
   * --------------------------------------------
   */
  modifier nonZeroAmount(uint256 amount) {
    require(amount > 0, "Amount must be greater than zero");
    _;
  }

  modifier userBalanceGte(uint256 amount) {
    require(IERC20(_tokenAddress).balanceOf(_msgSender()) >= amount, "Insufficient token balance");
    _;
  }

  modifier limitNotReached(uint256 amount) {
    require(add(totalStaked, amount) <= getStakeLimit(), "Staking pool limit reached");
    _;
  }

  modifier hasPosition(uint index) {
    require(stakingPositions[_msgSender()].length > 0, "Unstake: No staking positions");
    require(index < stakingPositions[_msgSender()].length, "closePosition: Index out of range");
    _;
  }

  modifier rewardsPoolNotEmpty() {
    uint256 contractBalance = _token.balanceOf(address(this));
    require(contractBalance > 0, "Rewards pool is empty");
    _;
  }

  /**
   * --------------------------------------------
   * Staking logic
   * --------------------------------------------
   */
  /**
   * @notice Stake tokens
   * @param amount The amount of tokens to stake
   * @dev The user must approve the staking contract to transfer tokens before calling this function
   * @dev The user must have enough tokens to stake
   * @dev A user can stake multiple times, each time will create a new staking position
   */
  function stakeTokens(
    uint256 amount
  )
    external
    nonReentrant
    whenNotPaused
    nonZeroAmount(amount)
    userBalanceGte(amount)
    limitNotReached(amount)
    onlyProxy
    rewardsPoolNotEmpty
  {
    address user = _msgSender();

    // Transfer tokens from user to staking contract
    IERC20(_tokenAddress).transferFrom(user, address(this), amount);

    // Create a new staking position for the amount and block timestamp
    stakingPositions[user].push(StakingPosition(amount, block.timestamp));

    // Update user's total staked amount
    userStakingTotals[user] = add(userStakingTotals[user], amount);

    // increment number of positions held by user by one
    userPositionCount[user] = add(userPositionCount[user], 1);

    // Update global total staking balance
    totalStaked = add(totalStaked, amount);

    // if first position opened by this user then count them
    if (stakingPositions[user].length == 1) {
      _numberOfStakers.increment();
    }

    emit Staked(user, amount);
  }

  /**
   * Calculate rewards for staking position (subtract the amount already claimed for the position)
   * Transfer original stake to user along with rewards
   * Delete the position, update user staking totals
   * Emit Unstaked event
   */
  function positionClose(
    uint256 index
  ) external nonReentrant onlyProxy whenNotPaused hasPosition(index) {
    address user = _msgSender();

    // get the position at the index
    StakingPosition memory position = stakingPositions[user][index];

    // calculate the rewards for this position
    uint256 rewards = calculatePositionRewards(position.amount, position.timestamp);

    // Ensure the contract has a sufficient balance to pay rewards
    require(IERC20(_tokenAddress).balanceOf(address(this)) >= rewards, "Insufficient balance to pay rewards");

    // delete the position
    stakingPositions[user] = removeStakingPosition(index, stakingPositions[user]);

    // decrement the number of positions held by user
    userPositionCount[user] = sub(userPositionCount[user], 1);

    // update user staked total
    userStakingTotals[user] = sub(userStakingTotals[user], position.amount);

    // update global staked total
    totalStaked = sub(totalStaked, position.amount);

    // transfer the original stake plus rewards to the user
    IERC20(_tokenAddress).transfer(user, add(position.amount, rewards));

    emit Unstaked(user, position.amount, rewards);
  }

  /**
   * Calculate rewards for a partial amount of the position using amount specified
   * Transfer amount specified of original stake to user along with rewards for the amount
   * Delete the position, update user staking totals
   * Using the remaining position amount, create a new position with no rewards claimed
   * Emit Unstaked event
   */
  function positionPartialClose(
    uint256 index,
    uint amountToUnstake
  ) external nonReentrant onlyProxy whenNotPaused hasPosition(index) {
    address user = _msgSender();

    require(
      amountToUnstake < stakingPositions[user][index].amount,
      "Amount must be less that position"
    );

    // get the position at the index
    StakingPosition memory position = stakingPositions[user][index];

    // amount to leave staked
    uint256 remainingAmount = sub(position.amount, amountToUnstake);

    // calculate the rewards for the amount specified
    uint256 rewards = calculatePositionRewards(amountToUnstake, position.timestamp);

    // Ensure the contract has a sufficient balance to pay rewards
    require(IERC20(_tokenAddress).balanceOf(address(this)) >= rewards, "Insufficient balance to pay rewards");

    // replace the position with new position for the remaining amount with the original timestamp
    stakingPositions[user][index] = StakingPosition(remainingAmount, position.timestamp);

    // update user staked total
    userStakingTotals[user] = sub(userStakingTotals[user], amountToUnstake);

    // update global staked total
    totalStaked = sub(totalStaked, amountToUnstake);

    // transfer the original stake plus rewards to the user
    IERC20(_tokenAddress).transfer(user, add(amountToUnstake, rewards));

    emit Unstaked(user, amountToUnstake, rewards);
  }

  /**
   * @notice Calculate the rewards for a staking position, transfer all staked + rewards to user
   * @dev Rewards are calculated based on the elapsed time for each staking position held by the user
   * @dev Rewards are calculated based on the APR and the amount staked
   */
  function unstakeTokens() external nonReentrant onlyProxy whenNotPaused {
    address user = _msgSender();

    require(stakingPositions[user].length > 0, "Unstake: No staking positions");

    uint256 amountStaked = userStakingTotals[user];
    uint256 rewards = getUserRewards(user);
    uint256 amountToTransfer = add(amountStaked, rewards);

    // Ensure the contract has a sufficient balance to pay
    require(
      IERC20(_tokenAddress).balanceOf(address(this)) >= amountToTransfer,
      "Insufficient balance to unstake and claim"
    );

    // Subtract amount from the user's staked total
    userStakingTotals[user] = sub(userStakingTotals[user], amountStaked);

    // Subtract user's stake from the grand total
    totalStaked = sub(totalStaked, amountStaked);

    // decrement the number of stakers
    _numberOfStakers.decrement();

    // Remove user's staking entry
    delete stakingPositions[user];

    // Remove user's staking position count
    delete userPositionCount[user];

    // Transfer staked tokens from staking contract back to user
    // only *after* zeroing their staked balance to help minimise attack vector
    // @see https://consensys.io/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
    IERC20(_tokenAddress).transfer(user, amountToTransfer);

    emit Unstaked(user, amountStaked, rewards);
  }

  /**
   * Calculate the user's total rewards to date across all positions and transfer them to user
   * Keep a record of the rewards they have claimed
   */
  function claimRewards() external nonReentrant onlyProxy whenNotPaused {
    address user = _msgSender();

    require(stakingPositions[user].length > 0, "Claim rewards: No staking positions");

    // calculate user's rewards at this time
    uint256 rewards = getUserRewards(user);

    // Ensure the contract has a sufficient balance to pay rewards
    require(IERC20(_tokenAddress).balanceOf(address(this)) >= rewards, "Insufficient balance to pay rewards");

    // set positions to current timestamp so they begin calculating
    // rewards from this point in time
    resetUserPositionTimestamps(user);

    // transfer the rewards to the user
    IERC20(_tokenAddress).transfer(user, rewards);

    emit ClaimRewards(user, rewards);
  }

  /**
   *
   */
  function resetUserPositionTimestamps(address user) internal {
    for (uint256 i = 0; i < stakingPositions[user].length; i++) {
      stakingPositions[user][i].timestamp = block.timestamp;
    }
  }

  /**
   * In an emergency this allows the contract owner to
   * withdraw all CRE funds held in the contract.
   */
  function withdrawFunds() external nonReentrant onlyOwner whenPaused {
    uint256 amount = IERC20(_tokenAddress).balanceOf(address(this));

    IERC20(_tokenAddress).transfer(owner(), amount);
    emit WithdrawFunds(owner(), amount);
  }

  /**
   * Calling this function sets a flag which will prevent
   * staking/unstaking calls
   */
  function pause() external onlyOwner whenNotPaused {
    _pause();
  }

  /**
   * Calling this function sets a flag which will prevent
   * staking/unstaking calls
   */
  function resume() external onlyOwner whenPaused {
    _unpause();
  }

  /**
   * EXTERNAL VIEWS
   */

  /**
   * @notice Get the total amount of tokens staked
   */
  function viewUserStakingRewards(address user) external view returns (uint256) {
    if (stakingPositions[user].length == 0) {
      return 0;
    }

    return getUserRewards(user);
  }

  /**
   * @notice The rewards per second a user is receiving across all their staking positions
   */
  function viewUserRewardsPerSecond(address user) external view returns (uint256) {
    if (stakingPositions[user].length == 0) {
      return 0;
    }

    uint256 rewardsPerYear = wmul(
      userStakingTotals[user],
      wdiv(mul(APR, PRECISION), mul(100, PRECISION))
    );
    uint256 rewardsPerSecond = wdiv(rewardsPerYear, mul(SECONDS_IN_YEAR, PRECISION));

    return rewardsPerSecond;
  }

  /**
   * @notice Return the contract APR
   */
  function viewApr() external view returns (uint256) {
    return APR;
  }

  /**
   * @notice Return the stake limit according to the current block time
   */
  function viewStakeLimit() external view returns (uint256) {
    return getStakeLimit();
  }

  function viewNumberOfStakers() external view returns (uint256) {
    return _numberOfStakers.current();
  }

  /**
   * INTERNAL FUNCTIONS
   */

  /**
   * Calculate the users rewards.
   * - Calculate from all staking positions
   * - Subtract amount of rewards already claimed
   */
  function getUserRewards(address user) internal view returns (uint256) {
    uint256 rewards = 0;

    // Calculate the total rewards from the user's staking staking positions
    // Calculate total staked amount and rewards
    for (uint256 i = 0; i < stakingPositions[user].length; i++) {
      uint256 amount = stakingPositions[user][i].amount;
      uint256 timestamp = stakingPositions[user][i].timestamp;

      rewards = add(rewards, calculatePositionRewards(amount, timestamp));
    }

    return rewards;
  }

  /**
   * @notice Calculate the rewards for a given staking position based on the elapsed time and APR.
   * @param positionAmount The amount of tokens staked.
   * @param positionTimestamp The timestamp when the stake was made.
   * @return The calculated rewards based on the elapsed time and APR.
   */
  function calculatePositionRewards(
    uint256 positionAmount,
    uint256 positionTimestamp
  ) internal view returns (uint256) {
    // Calculate the time elapsed since the position was opened
    uint256 elapsedSeconds = sub(getCurrentOrEndTime(), positionTimestamp);

    uint256 numerator = positionAmount * APR * elapsedSeconds;
    uint256 divisor = 100 * SECONDS_IN_YEAR * PRECISION;

    require(divisor > 0, "Cannot divide by zero");

    uint256 rewards = wdiv(numerator, divisor);

    // Return the calculated rewards
    return rewards;
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

    // Assuming 1 year is 360.25 days in seconds, add 1 to start the year count from 1.
    uint256 currentYear = add(1, (elapsedTime / SECONDS_IN_YEAR));
    return currentYear;
  }

  function removeStakingPosition(
    uint256 index,
    StakingPosition[] storage positions
  ) private returns (StakingPosition[] storage) {
    require(index < positions.length, "Index out of bounds");

    // shift elements to the left (this will delete the item at index)
    for (uint i = index; i < positions.length - 1; i++) {
      positions[i] = positions[i + 1];
    }

    // then remove the last entry
    positions.pop();

    return positions;
  }
}
