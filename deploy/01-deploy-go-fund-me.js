
const { networkConfig } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress
    if (chainId == "31337"){
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract doesn't exist, we deploy a minimal version of it for our local testing

    // what happens when we want to change chains?
    // when going for localhost or hardhat network, we want to use a mock
    const args = [ethUsdPriceFeedAddress]
    
    const goFundMe = await deploy("GoFundMe", {
        from: deployer,
        args: args, // priceFeed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (chainId != "31337" && process.env.ETHERSCAN_API_KEY) {
        // verify
        await verify(goFundMe.address, args)
    }

    log("--------------------------------------------")
}

module.exports.tags = ["all", "gofundme"]