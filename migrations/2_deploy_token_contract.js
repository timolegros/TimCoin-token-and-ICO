const token = artifacts.require("./token.sol");
const tokenSale = artifacts.require("./tokenSale.sol");

module.exports = function (deployer) {
    let tokenContract, tokenSaleContract
    deployer.then(() => {
        // deploy token contract
        return deployer.deploy(token, 1000000)
    }).then((tokenInstance) => {
        tokenContract = tokenInstance
        // deploy tokenSale contract
        return deployer.deploy(tokenSale, tokenContract.address, 1)
    }).then((tokenSaleInstance) => {
        tokenSaleContract = tokenSaleInstance
        // transfer the amount of tokens to use in ICO to tokenSaleContract
        return tokenContract.transfer(tokenSaleContract.address, 1000)
    }).then(() => {
        // check the new balance of the tokenSaleContract
        return tokenContract.balanceOf(tokenSaleContract.address)
    }).then((balance) => {
        console.log(">>>>>>>>>>>>>>>>>..", balance)
    }).catch((error) => {
        console.log(error)
    })
};
