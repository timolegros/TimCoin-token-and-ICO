// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "./token.sol";

contract tokenSale {

	address admin;
	token public tokenContract;
	uint256 public tokenPrice;
	uint256 public tokensSold;

	event Sell(
		address _buyer,
		uint256 _amount
	);

	constructor(token _tokenContract, uint256 _tokenPrice) {
		admin = msg.sender;
		tokenContract = _tokenContract;
		tokenPrice = _tokenPrice;
	}

	function safeMultiply(uint x, uint y) internal pure returns (uint z) {
		require(y == 0 || (z = x * y) / y == x);
	}

	function buyTokens(uint256 _numberOfTokens) public payable {
		require(msg.value == safeMultiply(_numberOfTokens, tokenPrice));

		tokensSold += _numberOfTokens;

		emit Sell(msg.sender, _numberOfTokens);
	}


}