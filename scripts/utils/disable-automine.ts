import { ethers } from "hardhat";
async function main() {
  /**
   * settings
   */
  await ethers.provider.send("evm_setAutomine", [false]);
  await ethers.provider.send("evm_setIntervalMining", [5000]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
