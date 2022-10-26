const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
  const { deployer } = await getNamedAccounts()
  const goFundMe = await ethers.getContract("GoFundMe", deployer)
  console.log("Withdrawing funds...")
  const txnResponse = await goFundMe.withdraw()
  await txnResponse.wait(1)
  console.log("Successfully withdrew funds from contract! ✅")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
