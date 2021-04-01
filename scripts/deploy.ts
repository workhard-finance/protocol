// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { deployAndGetFixtures } from "./fixtures";

async function main() {
  const fixtures = await deployAndGetFixtures();
  Object.keys(fixtures).forEach((key) => {
    console.log(`${key}:\n${fixtures[key].address}\n`);
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
