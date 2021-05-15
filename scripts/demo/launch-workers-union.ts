// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { goToNextWeek } from "../../test/utils/utilities";
import { getWorkersUnion } from "../utils/deployer";

async function launchWorkersUnion() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("Farmers union - snapshot id: ", result);
  const [signer] = await ethers.getSigners();

  const workersUnion = await getWorkersUnion(signer);

  await goToNextWeek();
  await goToNextWeek();
  await goToNextWeek();
  await goToNextWeek();
  await workersUnion.launch();
}

launchWorkersUnion()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
