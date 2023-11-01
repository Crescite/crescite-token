
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing the necessary OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Blacklistable.sol";

contract CommodityToken is ERC20, Ownable, AccessControl, Blacklistable {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
      _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
      _mint(to, amount);
    }

    // Override the transfer function of the ERC20 token to incorporate the blacklist check
    function transfer(address recipient, uint256 amount) public override notBlacklisted returns (bool) {
        require(!isBlacklisted[recipient], "Recipient is blacklisted");
        return super.transfer(recipient, amount);
    }

    // Override the transferFrom function to incorporate the blacklist check
    function transferFrom(address sender, address recipient, uint256 amount) public override notBlacklisted returns (bool) {
        require(!isBlacklisted[sender] , "Sender is blacklisted");
        require(!isBlacklisted[recipient], "Recipient is blacklisted");
        return super.transferFrom(sender, recipient, amount);
    }

    // Override the blacklist functions to allow only the owner to blacklist/unblacklist addresses
    function blacklistAddress(address _address) public override onlyOwner {
        isBlacklisted[_address] = true;
        emit Blacklisted(_address);
    }

    function unblacklistAddress(address _address) public override onlyOwner {
        isBlacklisted[_address] = false;
        emit Unblacklisted(_address);
    }
    function checkBlacklisted(address _address) public view override returns (bool) {
        return isBlacklisted[_address];
    }
}
