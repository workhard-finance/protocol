// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { constants } from "ethers";
import { getTimelockedGovernance, getVisionEmitter } from "../utils/deployer";
import { goTo, goToNextWeek } from "../../test/utils/utilities";

async function main() {
  const [signer] = await ethers.getSigners();
  const visionEmitter = await getVisionEmitter(signer);
  const timelock = await getTimelockedGovernance(signer);
  /** start **/
  const startTx = await visionEmitter.populateTransaction.start();
  const startTxTimelockTxParams = [
    visionEmitter.address,
    0,
    startTx.data,
    constants.HashZero,
    constants.HashZero,
  ];
  await goTo(86401);
  // @ts-ignore
  await timelock.execute(...startTxTimelockTxParams);

  /** distribute **/
  await goToNextWeek();
  await visionEmitter.distribute();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
