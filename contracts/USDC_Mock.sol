// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./CommodityToken.sol";

contract USDC_Mock is CommodityToken {
    constructor() CommodityToken("USD Mock Coin", "USDC") {}

}