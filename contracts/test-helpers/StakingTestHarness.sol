// SPDX-License-Identifier: GNU
pragma solidity ^0.8.17;

import "../Staking_V1.sol";

/**
 * @notice This contract is used for testing the internal functions of Staking.sol
 */
contract StakingTestHarness is Staking_V1 {
  function testCalculatePositionRewards(
    uint256 amount,
    uint256 timestamp
  ) external view returns (uint256) {
    // Call the internal function from the test contract
    return calculatePositionRewards(amount, timestamp);
  }

  function testGetCurrentOrEndTime() external view returns (uint256) {
    return getCurrentOrEndTime();
  }

  function testGetCurrentYear() external view returns (uint256) {
    return getCurrentYear();
  }

  function testViewOwner() external view returns (address) {
    return owner();
  }
}
