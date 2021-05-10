let tokenSale = artifacts.require("./tokenSale.sol")
let token = artifacts.require("./token.sol")

contract("tokenSale", (accounts) => {
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
		let receipt = await tsi.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice })
		assert.equal(receipt.logs.length, 1, "An event should be triggered")
        assert.equal(receipt.logs[0].event, "Sell", "The event triggered should be a Sell event")
        assert.equal(receipt.logs[0].args._buyer, buyer, "Should be the correct buyer")
        assert.equal(receipt.logs[0].args._amount, numberOfTokens, "Should be the correct number of tokens purchased")
        let temp = await tsi.tokensSold()
        assert.equal(temp.toNumber(), numberOfTokens, "Should increment the number of tokens sold")
        try {
        	await tsi.buyTokens(numberOfTokens, { from: buyer, value: 2 })
        	throw(new Error("buyToken function did not throw error"))
        } catch(error){
        	assert(error.message.indexOf("revert") >= 0, "Revert error should be raised if the purchase value of the tokens is incorrect")
        }
	})
})