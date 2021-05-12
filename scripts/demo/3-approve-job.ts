// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { goTo } from "../../test/utils/utilities";
import {
  getJobBoard,
  getProject,
  getTimelockedGovernance,
} from "../utils/deployer";

async function main() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("3. approve job - snapshot id: ", result);
  const [signer] = await ethers.getSigners();
  const jobBoard = await getJobBoard(signer);
  const project = await getProject(signer);
  const timelock = await getTimelockedGovernance(signer);
  const tokenId = await project.tokenByIndex(0);
  const tx = await jobBoard.populateTransaction.approveProject(tokenId);
  const data = tx?.data;
  await timelock
    .connect(signer)
    .schedule(
      jobBoard.address,
      0,
      data,
      ethers.constants.HashZero,
      ethers.constants.HashZero,
      BigNumber.from(86400)
    );
  await goTo(86400);
  await timelock
    .connect(signer)
    .execute(
      jobBoard.address,
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
