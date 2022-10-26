const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
  const { deployer } = await getNamedAccounts()
  const goFundMe = await ethers.getContract("GoFundMe", deployer)
  console.log("Funding contract...")
  const txnResponse = await goFundMe.fund({ value: ethers.utils.parseEther("0.1") })
  await txnResponse.wait(1)
  console.log("Funded!")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
