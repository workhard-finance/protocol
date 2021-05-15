// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat";
import { ERC20Mock__factory } from "../../src";
import { runTimelockTx } from "../../test/utils/utilities";
import {
  getBaseCurrency,
  getDividendPool,
  getTimelockedGovernance,
} from "../utils/deployer";

async function distributeReward() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("Distribute Reward - snapshot id: ", result);
  const [signer] = await ethers.getSigners();

  const baseCurrency = await getBaseCurrency(signer);
  await ERC20Mock__factory.connect(baseCurrency.address, signer).mint(
    signer.address,
    parseEther("10000")
  );
  const dividendPool = await getDividendPool(signer);
  const timelock = await getTimelockedGovernance(signer);
  await runTimelockTx(
    timelock,
    dividendPool.populateTransaction.addDistributor(signer.address)
  );
  await baseCurrency.approve(dividendPool.address, parseEther("10000"));
  await dividendPool.distribute(baseCurrency.address, parseEther("10000"));
  console.log(await dividendPool.claimable(baseCurrency.address));
}

distributeReward()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
