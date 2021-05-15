// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { constants } from "ethers";
import {
  getBaseCurrency,
  getCommitMining,
  getLiquidityMining,
  getTimelockedGovernance,
  getVisionEmitter,
} from "../../utils/deployer";
import {
  goTo,
  goToNextWeek,
  runTimelockTx,
} from "../../../test/utils/utilities";

export async function executeSetEmission() {
  const [signer] = await ethers.getSigners();
  const visionEmitter = await getVisionEmitter(signer);
  const timelock = await getTimelockedGovernance(signer);
  const liquidityMining = await getLiquidityMining(signer);
  const commitMining = await getCommitMining(signer);
  /** launch Mock DAI staking air drop pool */
  const baseCurrency = await getBaseCurrency(signer);
  await visionEmitter.newStakeMiningPool(baseCurrency.address);
  const airdropPool = await visionEmitter.stakeMiningPools(
    baseCurrency.address
  );
  /** set airdrop set emission */
  await runTimelockTx(
    timelock,
    visionEmitter.populateTransaction.setEmission(
      [liquidityMining.address, commitMining.address, airdropPool],
      [4745, 4745, 500],
      499,
      1
    )
  );

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
