// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { MyNetwork } from "../../deployed";
import {
  CryptoJobBoard,
  CryptoJobBoard__factory,
  TimelockedGovernance__factory,
} from "../../src";
import { goTo } from "../../test/utils/utilities";
import { getDeployed } from "../utils/deployer";

async function main() {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = getDeployed()[network];
  if (!deployed.CryptoJobBoard || !deployed.TimelockedGovernance)
    throw Error("not deployed");

  const [signer] = await ethers.getSigners();
  const cryptoJobBoard = CryptoJobBoard__factory.connect(
    deployed.CryptoJobBoard,
    signer
  );
  const timeLockGovernance = TimelockedGovernance__factory.connect(
    deployed.TimelockedGovernance,
    signer
  );
  const tx = await cryptoJobBoard.populateTransaction.approveProject(0);
  const data = tx?.data;
  await timeLockGovernance
    .connect(signer)
    .schedule(
      deployed.CryptoJobBoard,
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
      deployed.CryptoJobBoard,
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