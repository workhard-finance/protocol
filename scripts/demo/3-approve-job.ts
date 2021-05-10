// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { MyNetwork } from "../../deployed";
import {
  JobBoard,
  JobBoard__factory,
  Project__factory,
  TimelockedGovernance__factory,
} from "../../src";
import { goTo } from "../../test/utils/utilities";
import { getDeployed } from "../utils/deployer";

async function main() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("3. approve job - snapshot id: ", result);
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = getDeployed()[network];
  if (!deployed.JobBoard || !deployed.TimelockedGovernance)
    throw Error("not deployed");

  const [signer] = await ethers.getSigners();
  const jobBoard = JobBoard__factory.connect(deployed.JobBoard, signer);
  const project = Project__factory.connect(deployed.Project, signer);
  const timeLockGovernance = TimelockedGovernance__factory.connect(
    deployed.TimelockedGovernance,
    signer
  );
  const tokenId = await project.tokenByIndex(0);
  const tx = await jobBoard.populateTransaction.approveProject(tokenId);
  const data = tx?.data;
  await timeLockGovernance
    .connect(signer)
    .schedule(
      deployed.JobBoard,
      0,
      data,
      ethers.constants.HashZero,
      ethers.constants.HashZero,
      BigNumber.from(86400)
    );
  await goTo(86400);
  await timeLockGovernance
    .connect(signer)
    .execute(
      deployed.JobBoard,
      0,
      data,
      ethers.constants.HashZero,
      ethers.constants.HashZero
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
