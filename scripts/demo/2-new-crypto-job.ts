// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { getJobBoard } from "../utils/deployer";

export async function newCryptoJob() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("2. new crypto job - snapshot id: ", result);
  const [signer] = await ethers.getSigners();
  const jobBoard = await getJobBoard(signer);
  await jobBoard.createProject(
    "QmToBdkMKvKaCYRaZtRVWu1tZb3Zg6HSgz13nugRrwzRiJ"
  );
}
