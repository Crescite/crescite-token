// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/*
 * @dev `Escapable` provides the ability to withdraw all funds from a contract
 * escapeHatch() should be called used from a multisig wallet.
 */
abstract contract Escapable is Initializable {
  address private _baseTokenAddress;
  address private _escapeHatchCaller;
  address private _escapeHatchDestination;

  event EscapeHatchCalled(uint amount);
  event EscapeHatchCallerChanged(address indexed newAddress);
  event EtherReceived(address indexed from, uint amount);

  /**
   * @param baseTokenAddress address of the token used in parent contract, or 0x0 for ETH.
   * Token must implement IERC20 interface.

   * @param escapeHatchDestination Where to send funds

   * @param escapeHatchCaller Address permitted to call escapeHatch()
   */
  function __Escapable_init(
    address baseTokenAddress,
    address escapeHatchCaller,
    address escapeHatchDestination
  ) internal onlyInitializing {
    _baseTokenAddress = baseTokenAddress;
    _escapeHatchCaller = escapeHatchCaller;
    _escapeHatchDestination = escapeHatchDestination;
  }

  /*
   * @notice Require call is made by escapeHatchCaller
   */
  modifier onlyEscapeHatchCaller() {
    require(msg.sender == _escapeHatchCaller, "Escapable: not permitted");
    _;
  }

  /**
   * @dev Use the hook to apply access control from parent contract
   */
  function _beforeEscapeHatch(address caller) internal virtual {}

  /*
   * @notice This should be called from a multisig wallet
   */
  function escapeHatch() public onlyEscapeHatchCaller {
    _beforeEscapeHatch(msg.sender);

    uint total = getBalance();

    // Send the total balance of this contract to the `escapeHatchDestination`
    transfer(_escapeHatchDestination, total);

    emit EscapeHatchCalled(total);
  }

  /*
   * @notice Changes the address permitted to call escapeHatch()

   * @param _newEscapeHatchCaller The address of a trusted account or contract to
   *  call `escapeHatch()` to send the ether in this contract to the
   *  `escapeHatchDestination` it would be ideal that `escapeHatchCaller` cannot
   *  move funds out of `escapeHatchDestination`
   */
  function changeEscapeHatchCaller(address newAddress) public onlyEscapeHatchCaller {
    _escapeHatchCaller = newAddress;
    emit EscapeHatchCallerChanged(newAddress);
  }

  /*
   * @notice Returns the balance of the `baseToken` stored in this contract
   */
  function getBalance() internal view returns (uint) {
    // if a token has been specified return token balance
    if (_baseTokenAddress != address(0x0)) {
      return IERC20(_baseTokenAddress).balanceOf(address(this));
    } else {
      // no token specified so return ETH balance
      return address(this).balance;
    }
  }

  /*
   * @notice Sends an `amount` of `baseToken` to `to` from this contract,
   * and it can only be called by the contract itself
   * @param _to The address of the recipient
   * @param _amount The amount of `baseToken to be sent
   */
  function transfer(address to, uint amount) internal {
    // Send ERC20 token
    if (_baseTokenAddress != address(0x0)) {
      if (!IERC20(_baseTokenAddress).transfer(payable(to), amount)) {
        revert("Escapable: Transfer failed");
      }
    } else {
      // send ETH
      (bool success, ) = payable(to).call{value: amount}("");

      if (!success) {
        revert("Escapable: Send failed");
      }
    }
  }

  function viewEscapeHatchDestination() public view returns (address) {
    return _escapeHatchDestination;
  }

  /*
   * Receive Ether
   *
   * @notice Called anytime ether is sent to the contract emit event to help trace
   */
  receive() external payable {
    // Do not accept ether if baseToken is not ETH
    require(_baseTokenAddress == address(0x0), 'Escapable: Cannot receive ETH when baseToken is ERC20');
    emit EtherReceived(msg.sender, msg.value);
  }
}
