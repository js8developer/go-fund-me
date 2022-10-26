
const { network } = require("hardhat")
const { DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config")


module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    // hardhat chain == 31337
    if (chainId == "31337"){
        log("Local network detected. Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER] // parameters of the constructor for this contract
        })
        log("Mocks deployed!")
        log("--------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]