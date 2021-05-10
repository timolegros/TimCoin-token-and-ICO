const token = artifacts.require("./token.sol");
const tokenSale = artifacts.require("./tokenSale.sol");

module.exports = function (deployer) {
    deployer.deploy(token, 1000000).then(() => {
    	return deployer.deploy(tokenSale, token.address, 1)
    })
};
