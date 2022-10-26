const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

// Only run this if we are ON a testnet...
!developmentChains.includes(network.name) 
? describe.skip :
describe("GoFundMe", async function () {
    
    let goFundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")

    beforeEach(async function () {
        // deploy GoFundMe contract
        // using Hardhat-deploy
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        goFundMe = await ethers.getContract("GoFundMe", deployer)
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
    })

    describe("constructor", async function () {
        it("Sets the aggregator addresses correctly", async function () {
            const response = await goFundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(goFundMe.fund()).to.be.revertedWithCustomError(goFundMe, "GoFundMe__DidNotFundEnough")
        })
        it("Updated the amount funded data structure", async function () {
            await goFundMe.fund({ value: sendValue })
            const response = await goFundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async function () {
            await goFundMe.fund({ value: sendValue })
            const funder = await goFundMe.getFunder(0)
            assert.equal(funder, deployer)
        })
    })
    
    describe("withdraw", async function () {
        beforeEach(async function () {
            await goFundMe.fund({ value: sendValue })
        })
        
        it("Withdraw ETH from a single funder", async function () {
            // Arrange
            const startingGoFundMeBalance = await goFundMe.provider.getBalance(goFundMe.address)
            const startingDeployerBalance = await goFundMe.provider.getBalance(deployer)
            // Act
            const txnResponse = await goFundMe.withdraw()
            const txnReceipt = await txnResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = txnReceipt
            const totalGasCost = gasUsed.mul(effectiveGasPrice)
            const endingGoFundMeBalance = await goFundMe.provider.getBalance(goFundMe.address)
            const endingDeployerBalance = await goFundMe.provider.getBalance(deployer)
            // Assert
            assert.equal(endingGoFundMeBalance, 0)
            assert.equal(
                startingGoFundMeBalance.add(startingDeployerBalance).toString(), 
                endingDeployerBalance.add(totalGasCost).toString()
            )
        })
        
        it("Allows us to withdraw with multiple getFunder", async function () {
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++){
                const goFundMeConnectedContract = await goFundMe.connect(accounts[i])
                await goFundMeConnectedContract.fund({ value: sendValue })
            }
            const startingGoFundMeBalance = await goFundMe.provider.getBalance(goFundMe.address)
            const startingDeployerBalance = await goFundMe.provider.getBalance(deployer)

            const txnResponse = await goFundMe.withdraw()
            const txnReceipt = await txnResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = txnReceipt
            const totalGasCost = gasUsed.mul(effectiveGasPrice)

            const endingGoFundMeBalance = await goFundMe.provider.getBalance(goFundMe.address)
            const endingDeployerBalance = await goFundMe.provider.getBalance(deployer)
            // Assert
            assert.equal(endingGoFundMeBalance, 0)
            assert.equal(
                startingGoFundMeBalance.add(startingDeployerBalance).toString(), 
                endingDeployerBalance.add(totalGasCost).toString()
            )
            // Make sure getFunder are reset properly
            await expect(goFundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(await goFundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }
        })

        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await goFundMe.connect(attacker)
            await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(goFundMe, "GoFundMe__NotOwner")
        })

    })
    
})