// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { constants } from "ethers";
import hre, { ethers } from "hardhat";
import { MyNetwork } from "../../deployed";
import { getDeployed } from "../utils/deployer";
import { goTo, goToNextWeek } from "../../test/utils/utilities";
import {
  BurnMining,
  BurnMining__factory,
  StakeMining,
  StakeMining__factory,
  VisionEmitter,
  VisionEmitter__factory,
  TimelockedGovernance,
  TimelockedGovernance__factory,
} from "../../src";

async function main() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("1. set vision token emitter - snapshot id: ", result);

  /**
   * settings
   */
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = getDeployed()[network];
  if (
    !deployed.CommitMining ||
    !deployed.LiquidityMining ||
    !deployed.VisionEmitter ||
    !deployed.TimelockedGovernance
  )
    throw Error("not deployed");

  const [signer] = await ethers.getSigners();

  const commitMining: BurnMining = BurnMining__factory.connect(
    deployed.CommitMining,
    signer
  );

  const liquidityMining: StakeMining = StakeMining__factory.connect(
    deployed.LiquidityMining,
    signer
  );

  const visionEmitter: VisionEmitter = VisionEmitter__factory.connect(
    deployed.VisionEmitter,
    signer
  );

  const timeLockGovernance: TimelockedGovernance = TimelockedGovernance__factory.connect(
    deployed.TimelockedGovernance,
    signer
  );

  /** set initial emissions **/
  const initialEmission = [
    [commitMining.address, liquidityMining.address],
    [4745, 4745],
    500,
    10,
  ];

  const tx = await visionEmitter.populateTransaction.setEmission(
    // @ts-ignore
    ...initialEmission
  );
  const timelockTxParams = [
    visionEmitter.address,
    0,
    tx.data,
    constants.HashZero,
    constants.HashZero,
  ];
  // @ts-ignore
  await timeLockGovernance.schedule(...timelockTxParams, 86400);
  await goTo(86401);
  // @ts-ignore
  await timeLockGovernance.execute(...timelockTxParams);

  /** start **/
  const startTx = await visionEmitter.populateTransaction.start();
  const startTxTimelockTxParams = [
    visionEmitter.address,
    0,
    startTx.data,
    constants.HashZero,
    constants.HashZero,
  ];
  // @ts-ignore
  await timeLockGovernance.schedule(...startTxTimelockTxParams, 86400);
  await goTo(86401);
  // @ts-ignore
  await timeLockGovernance.execute(...startTxTimelockTxParams);

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
