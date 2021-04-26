import { ethers } from "hardhat";
async function main() {
  /**
   * settings
   */
  await ethers.provider.send("evm_setAutomine", [true]);
  await ethers.provider.send("evm_setIntervalMining", [0]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
