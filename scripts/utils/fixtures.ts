// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { Contract } from "ethers";
import {
  getBaseCurrency,
  getVision,
  getCommit,
  getRight,
  getProject,
  getVisionETHLP,
  getTeamShare,
  getTimelockedGovernance,
  getVeLocker,
  getDividendPool,
  getVoteCounter,
  getWorkersUnion,
  transferGovernance,
  getBurnMiningFactory,
  getStakeMiningFactory,
  getVisionEmitter,
  getLiquidityMining,
  getCommitMining,
  setVisionMinter,
  getStableReserve,
  setCommitMinter,
  getJobBoard,
  getMarketplace,
  initStableReserve,
  initDividendPool,
} from "./deployer";

export interface TokenFixture {
  baseCurrency: Contract;
  vision: Contract;
  commitToken: Contract;
  projectToken: Contract;
  visionLP: Contract;
  veVISION: Contract;
}

export interface GovernanceFixture extends TokenFixture {
  veLocker: Contract;
  workersUnion: Contract;
  voteCounter: Contract;
  timelock: Contract;
  teamShare: Contract;
  dividendPool: Contract;
}

export interface MiningFixture extends GovernanceFixture {
  visionEmitter: Contract;
  commitMining: Contract;
  liquidityMining: Contract;
}

export interface AppFixture extends MiningFixture {
  jobBoard: Contract;
  stableReserve: Contract;
  marketplace: Contract;
}

export async function getTokenFixture(): Promise<TokenFixture> {
  const [deployer] = await ethers.getSigners();
  // 1. Get base currency. (In mainnet use DAI & for testing deploy new)
  const baseCurrency = await getBaseCurrency(deployer);
  // 2. Deploy vision token
  const vision = await getVision(deployer);
  // 3. Deploy commit token
  const commitToken = await getCommit(deployer);
  // 4. Deploy uniswap pair
  const project = await getProject(deployer);
  // 5. Deploy uniswap pair
  const visionLP = await getVisionETHLP(deployer);
  // 6. Deploy RIGHT
  const veVISION = await getRight(deployer);
  return {
    baseCurrency,
    vision,
    veVISION,
    commitToken,
    projectToken: project,
    visionLP,
  };
}

export async function getGovernanceFixture(): Promise<GovernanceFixture> {
  const [deployer] = await ethers.getSigners();
  const tokenFixture: TokenFixture = await getTokenFixture();
  // 6. Deploy team share
  const teamShare = await getTeamShare(deployer);
  // 7. Deploy timelock contract
  const timelock = await getTimelockedGovernance(deployer);
  const veLocker = await getVeLocker(deployer);
  // 9. Deploy dividend pool
  const dividendPool = await getDividendPool(deployer);
  // 9. Deploy vote counter
  const voteCounter = await getVoteCounter(deployer);
  // 10. Deploy farmers union
  const workersUnion = await getWorkersUnion(deployer);
  // 11. Transfer the timelock admin to the farmers union and renounce the executor role after 4 weeks
  await transferGovernance(deployer);
  return {
    ...tokenFixture,
    teamShare,
    workersUnion,
    voteCounter,
    veLocker,
    timelock,
    dividendPool,
  };
}

export async function getMiningFixture(option?: {
  skipMinterSetting?: boolean;
}): Promise<MiningFixture> {
  const [deployer] = await ethers.getSigners();
  const governanceFixture: GovernanceFixture = await getGovernanceFixture();
  // 12. Deploy Burn Mining Factory
  const burnMiningFactory = await getBurnMiningFactory(deployer);
  // 13. Deploy Stake Mining Factory
  const stakeMiningFactory = await getStakeMiningFactory(deployer);
  // 14. Deploy Vision Token Emitter
  const visionEmitter = await getVisionEmitter(deployer);
  // 15. Launch the visionLP liquidity mining pool
  const liquidityMining = await getLiquidityMining(deployer);
  // 16. Launch the commit burn mining pool
  const commitMining = await getCommitMining(deployer);
  if (!option?.skipMinterSetting) {
    await setVisionMinter(deployer);
  }
  return {
    ...governanceFixture,
    visionEmitter,
    commitMining,
    liquidityMining,
  };
}

export async function getAppFixture(): Promise<AppFixture> {
  const [deployer] = await ethers.getSigners();
  const miningFixture: MiningFixture = await getMiningFixture();
  // 17. Deploy Labor Market
  const stableReserve = await getStableReserve(deployer);
  // 18. Move Minter Permission to StableReserve
  await setCommitMinter(deployer);
  // 19. Deploy Project Manager
  const jobBoard = await getJobBoard(deployer);
  // 20. Deploy Product Market
  const marketplace = await getMarketplace(deployer);
  // 21. Initialize Stable Reserve
  await initStableReserve(deployer);
  // 22. Initialize Dividend Pool
  await initDividendPool(deployer);
  return {
    ...miningFixture,
    jobBoard,
    stableReserve,
    marketplace,
  };
}

export async function deployAndGetFixtures(): Promise<AppFixture> {
  const appFixture = await getAppFixture();
  return appFixture;
}
