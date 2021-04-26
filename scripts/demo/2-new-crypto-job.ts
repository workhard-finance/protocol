// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { MyNetwork } from "../../deployed";
import { CryptoJobBoard, CryptoJobBoard__factory } from "../../src";
import { getDeployed } from "../utils/deployer";

async function main() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("2. new crypto job - snapshot id: ", result);
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = getDeployed();
  if (!deployed[network].CryptoJobBoard) throw Error("no crypto job board");

  const [signer] = await ethers.getSigners();
  const cryptoJobBoard = CryptoJobBoard__factory.connect(
    deployed[network].CryptoJobBoard,
    signer
  );
  await cryptoJobBoard.createProject(
    "Workhard Core Dev",
    "https://hackmd.io/something",
    ""
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
