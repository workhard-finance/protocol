// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { MyNetwork } from "../deployed";
import {
  getBaseCurrency,
  getBurnMiningFactory,
  getCommit,
  getCommitMining,
  getDividendPool,
  getJobBoard,
  getLiquidityMining,
  getMarketplace,
  getProject,
  getRight,
  getStableReserve,
  getStakeMiningFactory,
  getTeamShare,
  getTimelockedGovernance,
  getVeLocker,
  getVision,
  getVisionEmitter,
  getVisionETHLP,
  getVoteCounter,
  getWorkersUnion,
  initDividendPool,
  initStableReserve,
  scheduleTokenEmissionStart,
  setCommitMinter,
  setEmissionRate,
  setVisionMinter,
  transferGovernance,
  transferGovernanceOfEmitter,
} from "./utils/deployer";
import { sequence } from "./utils/helper";

async function main() {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const [deployer] = await ethers.getSigners();
  await sequence(network, 1, "Setup Base Currency", async () => {
    return (await getBaseCurrency(deployer)).address;
  });
  await sequence(network, 2, "Deploy $VISION", async () => {
    return (await getVision(deployer)).address;
  });
  await sequence(network, 3, "Deploy $COMMIT", async () => {
    return (await getCommit(deployer)).address;
  });
  await sequence(network, 4, "Deploy Project NFT contract", async () => {
    return (await getProject(deployer)).address;
  });
  await sequence(network, 5, "Deploy VISION/ETH LP", async () => {
    return (await getVisionETHLP(deployer)).address;
  });
  await sequence(network, 6, "Deploy $RIGHT", async () => {
    return (await getRight(deployer)).address;
  });
  await sequence(network, 7, "Deploy TeamShare", async () => {
    return (await getTeamShare(deployer)).address;
  });
  await sequence(network, 8, "Deploy TimelockedGovernance", async () => {
    return (await getTimelockedGovernance(deployer)).address;
  });
  await sequence(network, 9, "Deploy VotingEscrowLock", async () => {
    return (await getVeLocker(deployer)).address;
  });
  await sequence(network, 10, "Deploy DividendPool", async () => {
    return (await getDividendPool(deployer)).address;
  });
  await sequence(network, 11, "Deploy SquareRootVoteCounter", async () => {
    return (await getVoteCounter(deployer)).address;
  });
  await sequence(network, 12, "Deploy WorkersUnion", async () => {
    return (await getWorkersUnion(deployer)).address;
  });
  await sequence(network, 13, "Deploy BurnMiningFactory", async () => {
    return (await getBurnMiningFactory(deployer)).address;
  });
  await sequence(network, 14, "Deploy StakeMiningFactory", async () => {
    return (await getStakeMiningFactory(deployer)).address;
  });
  await sequence(network, 15, "Deploy VisionEmitter", async () => {
    return (await getVisionEmitter(deployer)).address;
  });
  await sequence(network, 16, "Launch LiquidityMining Pool", async () => {
    return (await getLiquidityMining(deployer)).address;
  });
  await sequence(network, 17, "Launch CommitMining Pool", async () => {
    return (await getCommitMining(deployer)).address;
  });
  await sequence(network, 18, "Set Emission", async () => {
    await setEmissionRate(deployer);
    return "success";
  });
  await sequence(
    network,
    19,
    "Set VisionEmitter as Vision Minter",
    async () => {
      await setVisionMinter(deployer);
      return "success";
    }
  );
  await sequence(
    network,
    20,
    "Transfer emitter governance to timelock",
    async () => {
      await transferGovernanceOfEmitter(deployer);
      return "success";
    }
  );
  await sequence(network, 21, "Deploy Stable Reserve", async () => {
    return (await getStableReserve(deployer)).address;
  });
  await sequence(
    network,
    22,
    "Set StableReserve as Commit Minter",
    async () => {
      await setCommitMinter(deployer);
      return "success";
    }
  );
  await sequence(network, 23, "Deploy JobBoard", async () => {
    return (await getJobBoard(deployer)).address;
  });
  await sequence(network, 24, "Deploy Marketplace", async () => {
    return (await getMarketplace(deployer)).address;
  });
  await sequence(network, 25, "Init Stable Reserve", async () => {
    await initStableReserve(deployer);
    return "success";
  });
  await sequence(network, 26, "Init Dividend Pool", async () => {
    await initDividendPool(deployer);
    return "success";
  });
  await sequence(network, 27, "Schedule token emission start", async () => {
    await scheduleTokenEmissionStart(deployer);
    return "success";
  });
  await sequence(network, 28, "Transfer Governance", async () => {
    await transferGovernance(deployer);
    return "transferred";
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
