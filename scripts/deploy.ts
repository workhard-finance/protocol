// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { ContributionBoard__factory, MyNetwork } from "../src";
import {
  getERC20StakeMiningV1Factory,
  getERC20BurnMiningV1Factory,
  getERC721StakeMiningV1Factory,
  getERC1155StakeMiningV1Factory,
  getBaseCurrency,
  getCommit,
  getDividendPool,
  getContributionBoard,
  getMarketplace,
  getRight,
  getStableReserve,
  getTimelockedGovernance,
  getVotingEscrow,
  getVision,
  getVisionEmitter,
  getVoteCounter,
  getWorkersUnion,
  getMultisig,
  getWETH,
  getPool2Factory,
  getProject,
  upgradeToMasterDAO,
  launchMasterDAO,
  getInitialContributorShareFactory,
  getERC1155BurnMiningV1Factory,
  getSablier,
} from "./utils/deployer";
import { sequence } from "./utils/helper";

async function main() {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const [deployer] = await ethers.getSigners();
  // 1. Get pre-deployed contracts
  await sequence(network, 1, "Setup Base Currency", async () => {
    return (await getBaseCurrency(deployer)).address;
  });
  await sequence(network, 2, "Get MultiSig", async () => {
    return (await getMultisig(deployer)).address;
  });
  await sequence(network, 3, "Get Pool2 Factory", async () => {
    return (await getPool2Factory(deployer)).address;
  });
  await sequence(network, 4, "Get WETH", async () => {
    return (await getWETH(deployer)).address;
  });
  await sequence(network, 5, "Get Sablier", async () => {
    return (await getSablier(deployer)).address;
  });
  // 2. Deploy Common Contracts
  await sequence(network, 6, "Deploy ERC20BurnMiningV1Factory", async () => {
    return (await getERC20BurnMiningV1Factory(deployer)).address;
  });
  await sequence(network, 7, "Deploy ERC20StakeMiningV1Factory", async () => {
    return (await getERC20StakeMiningV1Factory(deployer)).address;
  });
  await sequence(network, 8, "Deploy ERC721StakeMiningV1Factory", async () => {
    return (await getERC721StakeMiningV1Factory(deployer)).address;
  });
  await sequence(network, 9, "Deploy ERC1155StakeMiningV1Factory", async () => {
    return (await getERC1155StakeMiningV1Factory(deployer)).address;
  });
  await sequence(network, 10, "Deploy ERC1155BurnMiningV1Factory", async () => {
    return (await getERC1155BurnMiningV1Factory(deployer)).address;
  });
  await sequence(
    network,
    11,
    "Deploy InitialContributorShareFactory",
    async () => {
      return (await getInitialContributorShareFactory(deployer)).address;
    }
  );

  // 2. Deploy Controllers
  await sequence(network, 12, "Deploy TimelockedGovernance", async () => {
    return (await getTimelockedGovernance(deployer)).address;
  });
  await sequence(network, 13, "Deploy $VISION", async () => {
    return (await getVision(deployer)).address;
  });
  await sequence(network, 14, "Deploy $COMMIT", async () => {
    return (await getCommit(deployer)).address;
  });
  await sequence(network, 15, "Deploy $RIGHT", async () => {
    return (await getRight(deployer)).address;
  });
  await sequence(network, 16, "Deploy Stable Reserve", async () => {
    return (await getStableReserve(deployer)).address;
  });
  await sequence(network, 17, "Deploy ContribtionBoard", async () => {
    return (await getContributionBoard(deployer)).address;
  });
  await sequence(network, 18, "Deploy Marketplace", async () => {
    return (await getMarketplace(deployer)).address;
  });
  await sequence(network, 19, "Deploy DividendPool", async () => {
    return (await getDividendPool(deployer)).address;
  });
  await sequence(network, 20, "Deploy VoteCounter", async () => {
    return (await getVoteCounter(deployer)).address;
  });
  await sequence(network, 21, "Deploy WorkersUnion", async () => {
    return (await getWorkersUnion(deployer)).address;
  });
  await sequence(network, 22, "Deploy VisionEmitter", async () => {
    return (await getVisionEmitter(deployer)).address;
  });
  await sequence(network, 23, "Deploy VotingEscrowLock", async () => {
    return (await getVotingEscrow(deployer)).address;
  });
  await sequence(network, 24, "Deploy DAOFactory", async () => {
    return (await getProject(deployer)).address;
  });
  await sequence(network, 25, "Setup Master DAO", async () => {
    const workhardDAO = await getProject(deployer);
    await upgradeToMasterDAO(workhardDAO, deployer);
    return "success";
  });
  await sequence(network, 26, "Setup Initial Contributor Shares", async () => {
    const workhardDAO = await getProject(deployer);
    const masterDAO = await workhardDAO.getMasterDAO();
    await ContributionBoard__factory.connect(
      masterDAO.contributionBoard,
      deployer
    ).recordContribution(
      deployer.address,
      0,
      ethers.utils.parseEther("1000000")
    );
    return "success";
  });

  await sequence(network, 27, "Launch Master DAO", async () => {
    const workhardDAO = await getProject(deployer);
    await launchMasterDAO(workhardDAO, deployer);
    return "success";
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
