// SPDX-License-Identifier: GNU
pragma solidity ^0.8.17;

import "./Staking.sol";

/**
 * @notice This contract is used for testing the internal functions of Staking.sol
 */
contract StakingTestHarness is Staking {
  constructor(address tokenAddress) Staking(tokenAddress) {}

  function testCalculatePositionRewards(uint256 amount, uint256 timestamp) public view returns (uint256) {
    // Call the internal function from the test contract
    return calculatePositionRewards(amount, timestamp);
  }
}
