// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./staking/StakingUpgradeable.sol";
import "./Escapable.sol";

contract Staking_V1 is StakingUpgradeable, Escapable, AccessControlUpgradeable {
  bytes32 public constant ESCAPE_CALLER_ROLE = keccak256("ESCAPE_CALLER_ROLE");

  // Called by the deploy script, no manual call required
  function initialize(address tokenAddress, uint apr, address escapeHatchDestination) public initializer {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(ESCAPE_CALLER_ROLE, msg.sender);

    __Staking_init();
    __AccessControl_init();
    __Escapable_init(tokenAddress, msg.sender, escapeHatchDestination);

    _setToken(tokenAddress);
    _setAPR(apr);
  }

  function _beforeEscapeHatch(address caller) internal override onlyRole(ESCAPE_CALLER_ROLE) {
    super._beforeEscapeHatch(caller);
  }
}
