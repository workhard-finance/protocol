// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat";
import { ERC20Mock__factory } from "../../src";
import { getBaseCurrency } from "../utils/deployer";

async function mintBaseCurrency() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("Mint Base Currency - snapshot id: ", result);
  const [signer] = await ethers.getSigners();

  const baseCurrency = await getBaseCurrency(signer);
  await ERC20Mock__factory.connect(baseCurrency.address, signer).mint(
    signer.address,
    parseEther("10000")
  );
}

mintBaseCurrency()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
