// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { MyNetwork } from "../../deployed";
import { getDeployed } from "../utils/deployer";
import { FarmersUnion, FarmersUnion__factory } from "../../src";
import { goToNextWeek } from "../../test/utils/utilities";
async function main() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("4. farmers union - snapshot id: ", result);
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = getDeployed()[network];
  if (!deployed.FarmersUnion) throw Error("not deployed");

  const [signer] = await ethers.getSigners();

  const farmersUnion: FarmersUnion = FarmersUnion__factory.connect(
    deployed.FarmersUnion,
    signer
  );

  await goToNextWeek();
  await goToNextWeek();
  await goToNextWeek();
  await goToNextWeek();
  await farmersUnion.launch();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
