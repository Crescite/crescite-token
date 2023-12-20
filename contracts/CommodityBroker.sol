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
    ERC20 private usdcERC20;
    ERC20 private xaucERC20;

    constructor(address _treasuryWalletAddress,
      address _xaucERC20TokenAddress,
      address _usdcERC20TokenAddress,
      uint256 newRate, uint256 newSpread) {
        _grantRole(ADMIN_ROLE, msg.sender);
        treasuryWalletAddress = _treasuryWalletAddress;
        xaucERC20TokenAddress = _xaucERC20TokenAddress;
        usdcERC20TokenAddress = _usdcERC20TokenAddress;
        xaucERC20 = ERC20(xaucERC20TokenAddress);
        usdcERC20 = ERC20(usdcERC20TokenAddress);
        XAUC_USDC_Rate = newRate;
        spread = newSpread;
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

    // Helper function to convert uint256 to string
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

    function addressToString(address _addr) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory data = abi.encodePacked(_addr);
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(data[i] >> 4)];
            str[3+i*2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }


    // Function to create a detailed error message with a custom message
    function createErrorMessage(string memory message, uint256 available, uint256 required)
      internal pure returns (string memory) {
        return string(abi.encodePacked(
            message,
            ": available=", 
            uintToString(available),
            ", required=", 
            uintToString(required)
        ));
    }

    function checkBalance(ERC20 token, address account, uint256 amount, string memory tokenName) private view {
        uint256 balance = token.balanceOf(account);
        require(balance >= amount,
            createErrorMessage(
                string(abi.encodePacked("Not enough ", tokenName, " in ", addressToString(account)," wallet")),
                balance, 
                amount
            )
        );
    }

    function checkAllowance(ERC20 token, 
                            address owner, 
                            address spender, 
                            uint256 amount, 
                            string memory tokenName) private view {
        uint256 allowance = token.allowance(owner, spender);
        require(allowance >= amount,
            createErrorMessage(
                string(abi.encodePacked("Not enough allowance of ", 
                                          tokenName, " in ", 
                                          addressToString(owner),
                                          " wallet for spender=", addressToString(spender))),
                allowance, 
                amount
            )
        );
    }

    function purchase(uint256 xaucAmount, uint256 rate) public {
      // Check if the rate matches the ask rate
      require(rate == getAsk(), "Incorrect rate provided");

      // check if xaucAmount is greater than 0
      require(xaucAmount > 0, "Purchase amount must be greater than zero");

      // Check if the treasury has enough XAUC tokens
      checkBalance(xaucERC20, treasuryWalletAddress, xaucAmount, "XAUC");
      // Check if the treasury has allowed enough XAUC to be spent
      checkAllowance(xaucERC20, treasuryWalletAddress, address(this), xaucAmount, "XAUC");

      // Transfer USDC from sender to treasury
      // Assuming USDC token address is stored in usdcTokenAddress
      // and that the contract is already approved to spend the sender's USDC
      // Calculate USDC amount needed
      uint256 usdcAmount = wmul(xaucAmount, rate);

      // Check if the customer has enough USDC in their wallet
      checkBalance(usdcERC20, msg.sender, usdcAmount, "USDC");

      // Check if the customer has allowed enough USDC to be spent
      checkAllowance(usdcERC20, msg.sender, address(this), usdcAmount, "USDC");

      require(usdcERC20.transferFrom(msg.sender, treasuryWalletAddress, usdcAmount), "USDC transfer failed");

      // Transfer XAUC from treasury to sender
      // Assuming the contract has the necessary permissions to transfer treasury's XAUC tokens
      require(xaucERC20.transferFrom(treasuryWalletAddress, msg.sender, xaucAmount), "XAUC transfer failed");
    }


}