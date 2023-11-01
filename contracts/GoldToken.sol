// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./CommodityToken.sol";

contract GoldToken is CommodityToken {
    constructor() CommodityToken("Gold", "GLD") {}

}