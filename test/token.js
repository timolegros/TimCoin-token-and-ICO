let token = artifacts.require("./token.sol");

contract("token", (accounts) => {

    it("Initialize contact with correct name and symbol", async () => {
        let tokenInstance = await token.deployed()
        assert.equal(await tokenInstance.name(), "TimCoin", "The name is incorrect")
        assert.equal(await tokenInstance.symbol(), "TCoin", "The symbol is incorrect")
        assert.equal(await tokenInstance.standard(), "TimCoin v1.0", "The TimCoin standard is wrong")
    })

    it("Sets the total supply on deployment", async () => {
        let tokenInstance = await token.deployed()
        let totalSupply = await tokenInstance.totalSupply()
        assert.equal(totalSupply.toNumber(), 1000000, "Sets the total supply to 1,000,000")
    })

    it("Sets admin account balance to total supply", async () => {
        let tokenInstance = await token.deployed()
        let adminBalance = await tokenInstance.balanceOf(accounts[0])
        assert.equal(adminBalance.toNumber(), 1000000, "Sets the admin balance to the total supply")
    })

    it("Transfers token ownership", async () => {
        let tokenInstance = await token.deployed()
        try {
            await tokenInstance.transfer.call(accounts[0], 9999999)
            throw(new Error("Transfer above total supply should be rejected"))
        } catch(error) {
            assert(error.message.indexOf("revert") >= 0, "Error message must contain revert")
        }
        assert.equal(await tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] }), true, "The transfer function should return True")
        let receipt = await tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] })
        assert.equal(receipt.logs.length, 1, "An event should be triggered")
        assert.equal(receipt.logs[0].event, "Transfer", "The event triggered should be a Transfer event")
        assert.equal(receipt.logs[0].args._from, accounts[0], "Should be the correct sending account")
        assert.equal(receipt.logs[0].args._to, accounts[1], "Should be the correct receiving account")
        assert.equal(receipt.logs[0].args._value, 250000, "Transfer amount should be 250000")

        let balance = await tokenInstance.balanceOf(accounts[1])
        assert.equal(balance.toNumber(), 250000, "Adds transfer amount to the receiving account")
        balance = await tokenInstance.balanceOf(accounts[0])
        assert.equal(balance.toNumber(), 750000, "Deducts the transfer amount from the senders account")
    })



    it("Approves tokens for a delegated transfer", async () => {
        let tokenInstance = await token.deployed()
        assert.equal(await tokenInstance.approve.call(accounts[1], 100), true, "Aprove function must return True.")

        let receipt = await tokenInstance.approve(accounts[1], 100, { from: accounts[0] })
        assert.equal(receipt.logs.length, 1, "An event should be triggered")
        assert.equal(receipt.logs[0].event, "Approval", "The event triggered should be an Approval event")
        assert.equal(receipt.logs[0].args._owner, accounts[0], "Should be the correct owner account")
        assert.equal(receipt.logs[0].args._spender, accounts[1], "Should be the account the tokens are authorized to")
        assert.equal(receipt.logs[0].args._value, 100, "Transfer amount should be 100")

        let allowance = await tokenInstance.allowance(accounts[0], accounts[1])
        assert.equal(allowance.toNumber(), 100, "The allowance of account 1 from account 0 should be 100")
    })


    it("Handles delegated token transfers", async () => {
        let tokenInstance = await token.deployed()
        await tokenInstance.transfer(accounts[2], 100, { from: accounts[0] })
        await tokenInstance.approve(accounts[4], 20, { from: accounts[2] })
        try {
            await tokenInstance.transferFrom(accounts[2], accounts[3], 999999, { from: accounts[4] })
            throw(new Error("Function should throw error if attempting to transferred more than the balance amount"))
        } catch(error) {
            assert(error.message.indexOf("revert") >= 0, "Cannot transfer values larger than the balance")
        }

        try {
            await tokenInstance.transferFrom(accounts[2], accounts[3], 50, { from: accounts[4] })
            throw(new Error("Function should throw error if attempting to transfer more than the delegated amount"))
        } catch(error) {
            assert(error.message.indexOf("revert") >= 0, "Cannot transfer values larger than the approved amount")
        }

        assert.equal(await tokenInstance.transferFrom.call(accounts[2], accounts[3], 15, { from: accounts[4] }), true, "TransferFrom should return true if successful")

        let receipt = await tokenInstance.transferFrom(accounts[2], accounts[3], 15, { from: accounts[4] })
        assert.equal(receipt.logs.length, 1, "An event should be triggered")
        assert.equal(receipt.logs[0].event, "Transfer", "The event triggered should be a Transfer event")
        assert.equal(receipt.logs[0].args._from, accounts[2], "Should be the correct from account")
        assert.equal(receipt.logs[0].args._to, accounts[3], "Should be the account the tokens are being transferred to")
        assert.equal(receipt.logs[0].args._value, 15, "Transfer amount should be 15")

        let balance = await tokenInstance.balanceOf(accounts[2])
        assert.equal(balance.toNumber(), 85, "From account should be deducted the sent amount")

        balance = await tokenInstance.balanceOf(accounts[3])
        assert.equal(balance.toNumber(), 15, "To account should receive the tokens")

        assert.equal(await tokenInstance.allowance(accounts[2], accounts[4]), 5, "Should deduct amount from the allowance")

    })
})
