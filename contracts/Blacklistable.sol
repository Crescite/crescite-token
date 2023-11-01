// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing the necessary OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Blacklistable abstract contract (as provided before)

abstract contract Blacklistable {
    mapping(address => bool) internal isBlacklisted;

    event Blacklisted(address indexed _address);
    event Unblacklisted(address indexed _address);

    modifier notBlacklisted() {
        require(!isBlacklisted[msg.sender], "Sender is blacklisted");
        _;
    }

    function blacklistAddress(address _address) public virtual;
    function unblacklistAddress(address _address) public virtual;
    function checkBlacklisted(address _address) public view virtual returns (bool);
}
