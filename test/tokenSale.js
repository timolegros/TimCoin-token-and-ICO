let tokenSale = artifacts.require("./tokenSale.sol")
let token = artifacts.require("./token.sol")

contract("tokenSale", (accounts) => {
	let admin = accounts[0]
	let tokensICO = 500000
	let buyer = accounts[1]
	let tokenPrice = 1
	let numberOfTokens = 10

	it("Initializes the contract with the correct values", async () => {
		let tsi = await tokenSale.deployed()
		assert.notEqual(tsi.address, 0x0, "Token Sale Contract doesn't exist")
		assert.notEqual(await tsi.tokenContract(), 0x0, "Token Sale Contract is not correctly deployed")
		assert.equal(await tsi.tokenPrice(), tokenPrice, "Token price is incorrect")
	})

	it("Enables the purchase of tokens", async () => {
		let tsi = await tokenSale.deployed()
		let ti = await token.deployed()

		// Provisions 50% of total supply for the ICO/sale --- transfers 500000 tokens from the admin account to the tokenSale contract
		await ti.transfer(tsi.address, tokensICO, { from: admin })

		let receipt = await tsi.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice })
		assert.equal(receipt.logs.length, 1, "An event should be triggered")
        assert.equal(receipt.logs[0].event, "Sell", "The event triggered should be a Sell event")
        assert.equal(receipt.logs[0].args._buyer, buyer, "Should be the correct buyer")
        assert.equal(receipt.logs[0].args._amount, numberOfTokens, "Should be the correct number of tokens purchased")
        let temp = await tsi.tokensSold()
        assert.equal(temp.toNumber(), numberOfTokens, "Should increment the number of tokens sold")

        // checks that the number of tokens the tokenSale contract owns decreases by the correct amount
        let balance = await ti.balanceOf(tsi.address)
        assert.equal(balance.toNumber(), 499990, "Should decrement the number of tokens the TokenSale contract has")

        // checks that the number of tokens the buyer owns increases by the correct amount
       	balance = await ti.balanceOf(accounts[1])
       	assert.equal(balance.toNumber(), 10, "Should increment the number of tokens the buyer owns")

        try {
        	await tsi.buyTokens(numberOfTokens, { from: buyer, value: 2 })
        	throw(new Error("buyToken function did not throw error"))
        } catch(error){
        	assert(error.message.indexOf("revert") >= 0, "Revert error should be raised if the purchase value of the tokens is incorrect")
        }
        try {
			// attempts to buy more than the 500000 tokens sent to the tokenSale contract
			await tsi.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice})
			throw(new Error("buyTokens should raise an error if attempting too many tokens"))
		} catch(error) {
        	assert(error.message.indexOf("revert") >= 0, "Revert error should be raised if the attempting to buy too many tokens")
		}
	})

	it("Enables ending the token sale", async () => {
		let tsi = await tokenSale.deployed()
		let ti = await token.deployed()

		// attempts to end the token sale from a non-admin account
		try {
			await tsi.endSale({ from: buyer })
			throw(new Error("Only admins should be able to end the token sale"))
		} catch(error) {
			assert(error.message.indexOf("revert") >= 0, "Revert error should be raised if non-admin attempts to end the token sale")
		}

		let receipt = await tsi.endSale({ from: admin })
		let balance = await ti.balanceOf(admin)
		assert.equal(balance.toNumber(), 999990, "All unsold tokens should be returned to the admin")

		// check if contract was properly disabled
		try {
			let price = await tsi.tokenPrice()
			throw(new Error("Contact is not disabled"))
		} catch(error) {
			assert(error.message.indexOf("Returned values") >= 0, "Contract should be properly destroyed")
		}

	})
})