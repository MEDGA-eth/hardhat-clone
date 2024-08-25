// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.4.19;

import { WETH9 } from "WETH/WETH9.sol";

contract MyToken is WETH9 {
	function getMyBalance() public view returns (uint) {
		return balanceOf[msg.sender];
	}
}
