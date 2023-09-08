// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./staking/StakingUpgradeable.sol";

contract Staking_V1 is StakingUpgradeable {
  // Called by the deploy script, no manual call required
  function initialize(address tokenAddress, uint apr) public initializer {
    __Staking_init();

    _setToken(tokenAddress);
    _setAPR(apr);
  }
}
