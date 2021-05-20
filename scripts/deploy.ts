// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { MyNetwork } from "../deployed";
import {
  addTokensToDividendPool,
  getERC20StakeMiningV1Factory,
  getERC20BurnMiningV1Factory,
  getERC721StakeMiningV1Factory,
  getERC1155StakeMiningV1Factory,
  initFounderSharePool,
  getFounderSharePool,
  addERC20StakeMiningFactory,
  addERC20BurnMiningFactory,
  addERC721StakeMiningFactory,
  addERC1155StakeMiningFactory,
  getBaseCurrency,
  getCommit,
  getCommitMining,
  getDividendPool,
  getJobBoard,
  getLiquidityMining,
  getMarketplace,
  getProject,
  getRight,
  getStableReserve,
  getFounderShare,
  getTimelockedGovernance,
  getVeLocker,
  getVision,
  getVisionEmitter,
  getVisionETHLP,
  getVoteCounter,
  getWorkersUnion,
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
  await sequence(network, 7, "Deploy FounderShare", async () => {
    return (await getFounderShare(deployer)).address;
  });
  await sequence(network, 8, "Deploy FounderSharePool", async () => {
    return (await getFounderSharePool(deployer)).address;
  });
  await sequence(network, 9, "Deploy TimelockedGovernance", async () => {
    return (await getTimelockedGovernance(deployer)).address;
  });
  await sequence(network, 10, "Deploy VotingEscrowLock", async () => {
    return (await getVeLocker(deployer)).address;
  });
  await sequence(network, 11, "Deploy DividendPool", async () => {
    return (await getDividendPool(deployer)).address;
  });
  await sequence(network, 12, "Deploy SquareRootVoteCounter", async () => {
    return (await getVoteCounter(deployer)).address;
  });
  await sequence(network, 13, "Deploy WorkersUnion", async () => {
    return (await getWorkersUnion(deployer)).address;
  });
  await sequence(network, 14, "Deploy ERC20StakeMiningV1Factory", async () => {
    return (await getERC20StakeMiningV1Factory(deployer)).address;
  });
  await sequence(network, 15, "Deploy ERC20BurnMiningV1Factory", async () => {
    return (await getERC20BurnMiningV1Factory(deployer)).address;
  });
  await sequence(network, 16, "Deploy ERC721StakeMiningV1Factory", async () => {
    return (await getERC721StakeMiningV1Factory(deployer)).address;
  });
  await sequence(
    network,
    17,
    "Deploy ERC1155StakeMiningV1Factory",
    async () => {
      return (await getERC1155StakeMiningV1Factory(deployer)).address;
    }
  );
  await sequence(network, 18, "Deploy VisionEmitter", async () => {
    return (await getVisionEmitter(deployer)).address;
  });
  await sequence(network, 19, "Initialize FounderShare", async () => {
    await initFounderSharePool(deployer);
    return "success";
  });
  await sequence(network, 20, "add ERC20BurnMiningV1Factory", async () => {
    await addERC20BurnMiningFactory(deployer);
    return "success";
  });
  await sequence(network, 21, "add ERC20StakeMiningV1Factory", async () => {
    await addERC20StakeMiningFactory(deployer);
    return "success";
  });
  await sequence(network, 22, "add ERC721StakeMiningV1Factory", async () => {
    await addERC721StakeMiningFactory(deployer);
    return "success";
  });
  await sequence(network, 23, "add ERC1155StakeMiningV1Factory", async () => {
    await addERC1155StakeMiningFactory(deployer);
    return "success";
  });
  await sequence(network, 24, "Launch LiquidityMining Pool", async () => {
    return (await getLiquidityMining(deployer)).address;
  });
  await sequence(network, 25, "Launch CommitMining Pool", async () => {
    return (await getCommitMining(deployer)).address;
  });
  await sequence(network, 26, "Set Emission", async () => {
    await setEmissionRate(deployer);
    return "success";
  });
  await sequence(
    network,
    27,
    "Set VisionEmitter as Vision Minter",
    async () => {
      await setVisionMinter(
        await getVision(deployer),
        await getVisionEmitter(deployer),
        deployer
      );
      return "success";
    }
  );
  await sequence(
    network,
    28,
    "Transfer emitter governance to timelock",
    async () => {
      await transferGovernanceOfEmitter(
        await getVisionEmitter(deployer),
        await getTimelockedGovernance(deployer),
        deployer
      );
      return "success";
    }
  );
  await sequence(network, 29, "Deploy Stable Reserve", async () => {
    return (await getStableReserve(deployer)).address;
  });
  await sequence(
    network,
    30,
    "Set StableReserve as Commit Minter",
    async () => {
      await setCommitMinter(
        await getCommit(deployer),
        await getStableReserve(deployer),
        deployer
      );
      return "success";
    }
  );
  await sequence(network, 31, "Deploy JobBoard", async () => {
    return (await getJobBoard(deployer)).address;
  });
  await sequence(network, 32, "Deploy Marketplace", async () => {
    return (await getMarketplace(deployer)).address;
  });
  await sequence(network, 33, "Init Stable Reserve", async () => {
    await initStableReserve(
      await getStableReserve(deployer),
      await getJobBoard(deployer),
      deployer
    );
    return "success";
  });
  await sequence(network, 34, "Schedule token emission start", async () => {
    await scheduleTokenEmissionStart(
      await getVisionEmitter(deployer),
      await getTimelockedGovernance(deployer),
      deployer
    );
    return "success";
  });
  await sequence(network, 35, "Add tokens to the dividend pool", async () => {
    await addTokensToDividendPool(
      await getTimelockedGovernance(deployer),
      await getDividendPool(deployer),
      await getBaseCurrency(deployer),
      await getCommit(deployer),
      deployer
    );
    return "transferred";
  });
  await sequence(network, 36, "Transfer Governance", async () => {
    await transferGovernance(
      await getTimelockedGovernance(deployer),
      await getWorkersUnion(deployer),
      deployer
    );
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
