// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./CommodityToken.sol";

contract DiamondToken is CommodityToken {
    constructor() CommodityToken("DiamondToken", "DIAM") {
        // Additional initialization if required
    }

}