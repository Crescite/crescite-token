// contracts/CommodityBroker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Importing the necessary OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Blacklistable.sol";
import "./math/DSMath.sol";

contract CommodityBroker is DSMath, Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");


    uint256 private PRECISION = 1e18;
   // Variables to store rate and spread
    uint256 private XAUC_USDC_Rate;
    uint256 private spread; // in basic point
    address private treasuryWalletAddress;
    address private xaucERC20TokenAddress;
    address private usdcERC20TokenAddress;

    constructor(address _treasuryWalletAddress,
      address _xaucERC20TokenAddress,
      address _usdcERC20TokenAddress) {
        _grantRole(ADMIN_ROLE, msg.sender);
        treasuryWalletAddress = _treasuryWalletAddress;
        xaucERC20TokenAddress = _xaucERC20TokenAddress;
        usdcERC20TokenAddress = _usdcERC20TokenAddress;
    }

    // Setter function to set the rate and spread
    function setRateAndSpread(uint256 newRate, uint256 newSpread) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        XAUC_USDC_Rate = newRate;
        spread = newSpread;
    }

    // Getter function to get the current rate
    function getCurrentRate() public view returns (uint256) {
        return XAUC_USDC_Rate;
    }

    // Getter function to get the current spread
    function getCurrentSpread() public view returns (uint256) {
        return spread;
    }

    // Method to get the bid price
    function getBid() public view returns (uint256) {
        uint256 oneMinusSpread = sub(WAD, spread); // WAD is 10^18 in DS-Math
        return wmul(XAUC_USDC_Rate, oneMinusSpread);
    }

    // Method to get the ask price
    function getAsk() public view returns (uint256) {
        // Calculate (1 + spread) in fixed-point
        uint256 onePlusSpread = add(WAD, spread); // WAD is 10^18 in DS-Math

        // Calculate XAUC_USDC_Rate * (1 + spread)
        uint256 askRate = wmul(XAUC_USDC_Rate, onePlusSpread);

        return askRate;
    }

        // Setter for treasuryWalletAddress
    function setTreasuryWalletAddress(address newTreasuryWalletAddress) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        treasuryWalletAddress = newTreasuryWalletAddress;
    }

    // Getter for treasuryWalletAddress
    function getTreasuryWalletAddress() public view returns (address) {
        return treasuryWalletAddress;
    }

    function uintToString(uint256 value) internal pure returns (string memory) {
        // Base case
        if (value == 0) {
            return "0";
        }
        // Temporarily store value for length calculation
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        // Convert the number to string
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }


    function purchase(uint256 xaucAmount, uint256 rate) public {
      // Check if the rate matches the ask rate
      require(rate == getAsk(), "Incorrect rate provided");

      uint256 balanceOfXauc = ERC20(xaucERC20TokenAddress).
        balanceOf(treasuryWalletAddress);
      // Check if the treasury has enough XAUC tokens
      require(balanceOfXauc >= xaucAmount,
        string(abi.encodePacked("Not enough XAUC in treasury: available=", 
                            uintToString(balanceOfXauc), 
                    
                            ", required=", 
                            uintToString(xaucAmount))));

      uint256 balanceOfUsdc = ERC20(xaucERC20TokenAddress).
        balanceOf(treasuryWalletAddress);
      // Transfer USDC from sender to treasury
      // Assuming USDC token address is stored in usdcTokenAddress
      // and that the contract is already approved to spend the sender's USDC
      uint256 usdcAmount = wmul(xaucAmount, rate);

      require(balanceOfUsdc >= usdcAmount,
        string(abi.encodePacked("Not enough USDC in the customer's wallet: available=", 
                              uintToString(balanceOfUsdc), 
                              ", required=", 
                              uintToString(usdcAmount))));
      require(ERC20(usdcERC20TokenAddress).transferFrom(msg.sender, treasuryWalletAddress, usdcAmount), "USDC transfer failed");

      // Transfer XAUC from treasury to sender
      // Assuming the contract has the necessary permissions to transfer treasury's XAUC tokens
      require(ERC20(xaucERC20TokenAddress).transferFrom(treasuryWalletAddress, msg.sender, xaucAmount), "XAUC transfer failed");
    }


}