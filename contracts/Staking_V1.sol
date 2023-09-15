// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./staking/StakingUpgradeable.sol";
import "./Escapable.sol";

contract Staking_V1 is StakingUpgradeable, Escapable, AccessControlUpgradeable {
  bytes32 public constant ESCAPE_CALLER_ROLE = keccak256("ESCAPE_CALLER_ROLE");
  bytes32 public constant ESCAPE_CALLER_ADMIN_ROLE = keccak256("ESCAPE_CALLER_ADMIN_ROLE");

  // Called by the deploy script, no manual call required
  function initialize(address tokenAddress, uint apr, address escapeHatchDestination) public initializer {
    __Staking_init();
    __AccessControl_init();
    __Escapable_init(tokenAddress, _msgSender(), escapeHatchDestination);

    // call _grantRole() instead of grantRole() (no '_' prefix) to bypass role checks
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _grantRole(ESCAPE_CALLER_ROLE, _msgSender());
    _grantRole(ESCAPE_CALLER_ADMIN_ROLE, _msgSender());
    _setRoleAdmin(ESCAPE_CALLER_ROLE, ESCAPE_CALLER_ADMIN_ROLE);

    _setToken(tokenAddress);
    _setAPR(apr);
  }

  function _beforeEscapeHatch(address caller) internal virtual override onlyRole(ESCAPE_CALLER_ROLE) {
    super._beforeEscapeHatch(caller);
  }

  /**
   * @dev Calling grantRole(ESCAPE_CALLER_ROLE, address) is not sufficient to permit escape hatch calling.
   * The Escapable contract also requires the `escapeHatchCaller` property be set.
   */
  function transferEscapeCallerRoleTo(address user) public onlyRole(ESCAPE_CALLER_ROLE) {
    // grant ESCAPE_CALLER_ROLE role to user
    grantRole(ESCAPE_CALLER_ROLE, user);
    grantRole(ESCAPE_CALLER_ADMIN_ROLE, user);

    // Now update Escapable contract variable
    changeEscapeHatchCaller(user);

    // Revoke the calling user's roles, completing the transfer
    revokeRole(ESCAPE_CALLER_ROLE, _msgSender());
    revokeRole(ESCAPE_CALLER_ADMIN_ROLE, _msgSender());
  }
}
