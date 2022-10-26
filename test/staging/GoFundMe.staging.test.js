const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

// Only run this if we are NOT on a development chain...
developmentChains.includes(network.name) 
? describe.skip :
describe("GoFundMe", async function () {
    let goFundMe
    let deployer
    const sendValue = ethers.utils.parseEther("0.04") // ~ $50

    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        goFundMe = await ethers.getContract("GoFundMe", deployer)
    })

    it("Allows people to fund and withdraw", async function () {
        await goFundMe.fund({ value: sendValue })
        await goFundMe.withdraw()
        const endingBalance = await goFundMe.provider.getBalance(goFundMe.address)
        assert.equal(endingBalance.toString(), "0")
    })    
})