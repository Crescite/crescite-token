// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/*
 * Adapted from https://github.com/Giveth/Donation-Doubler/blob/master/contracts/Escapable.sol
 *
 * @dev `Escapable` is a base level contract for and contract that wants to
 * add an escape hatch for a contract that holds ETH or ERC20 tokens. This
 * contract creates an `escapeHatch()` function to send its tokens to
 * `escapeHatchDestination` when called by the `escapeHatchCaller` in the case that
 * something unexpected happens
 */
abstract contract Escapable is Initializable {
  address private _baseTokenAddress;
  address private _escapeHatchCaller;
  address private _escapeHatchDestination;

  event EscapeHatchCalled(uint amount);
  event EscapeHatchCallerChanged(address indexed newEscapeHatchCaller);
  event EtherReceived(address indexed from, uint amount);

  /**
   * @notice The initializer function assigns the `escapeHatchDestination`, the `escapeHatchCaller`, and the `baseToken`
   *
   * @param baseTokenAddress The address of the token that is used as a store value
   * for this contract, 0x0 in case of ether. The token must implement IERC20 interface.
   *
   * @param escapeHatchDestination The address of a safe location (use a
   * Multisig) to send the token defined by baseTokenAddress held in this contract
   *
   * @param escapeHatchCaller The address of a trusted account or contract to
   * call `escapeHatch()` to send the `baseToken` in this contract to the
   * `escapeHatchDestination` it would be ideal that `escapeHatchCaller`
   * cannot move funds out of `escapeHatchDestination`
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
   * @dev The addresses preassigned the `escapeHatchCaller` role
   *  is the only addresses that can call a function with this modifier
   */
  modifier onlyEscapeHatchCaller() {
    require(msg.sender == _escapeHatchCaller, 'Escapable: not permitted');
    _;
  }

  /**
   * @dev Hook called before executing the escapeHatch() function
   *  can be used to apply access control from within the parent contract
   */
  function _beforeEscapeHatch(address caller) internal virtual {}

  /*
   * @notice The `escapeHatch()` should only be called as a last resort if a
   * security issue is uncovered or something unexpected happened
   */
  function escapeHatch() public onlyEscapeHatchCaller {
    _beforeEscapeHatch(msg.sender);

    uint total = getBalance();

    // Send the total balance of this contract to the `escapeHatchDestination`
    transfer(_escapeHatchDestination, total);

    emit EscapeHatchCalled(total);
  }

  /*
   * @notice Changes the address assigned to call `escapeHatch()`
   * @param _newEscapeHatchCaller The address of a trusted account or contract to
   *  call `escapeHatch()` to send the ether in this contract to the
   *  `escapeHatchDestination` it would be ideal that `escapeHatchCaller` cannot
   *  move funds out of `escapeHatchDestination`
   */
  function changeEscapeHatchCaller(address _newEscapeHatchCaller) public onlyEscapeHatchCaller {
    _escapeHatchCaller = _newEscapeHatchCaller;
    emit EscapeHatchCallerChanged(_escapeHatchCaller);
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
        revert('Escapable: Transfer failed');
      }
    } else {
      // send ETH
      if (!payable(to).send(amount)) {
        revert('Escapable: Send failed');
      }
    }
  }

  /*
   * Receive Ether
   *
   * @notice Called anytime ether is sent to the contract && creates an event
   * to more easily track the incoming transactions
   */
  receive() external payable {
    // Do not accept ether if baseToken is not ETH
    require(_baseTokenAddress == address(0x0), 'Escapable: Cannot receive ETH when baseToken is ERC20');
    emit EtherReceived(msg.sender, msg.value);
  }
}
