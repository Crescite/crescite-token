// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Escapable.sol";

contract EscapableHarness is Initializable, Escapable {
  function initialize(address tokenAddress, address caller, address destination) public initializer {
    __Escapable_init(tokenAddress, caller, destination);
  }
}
