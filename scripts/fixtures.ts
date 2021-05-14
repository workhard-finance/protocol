// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {
  transferGovernance,
  setVisionMinter,
  setCommitMinter,
  initStableReserve,
  initDividendPool,
  WETH,
  ONE_INCH,
  transferGovernanceOfEmitter,
} from "./utils/deployer";
import {
  BurnMining,
  BurnMiningPoolFactory__factory,
  BurnMining__factory,
  COMMIT,
  COMMIT__factory,
  DividendPool,
  DividendPool__factory,
  ERC20Mock,
  ERC20Mock__factory,
  IERC20,
  IERC20__factory,
  JobBoard,
  JobBoard__factory,
  Marketplace,
  Marketplace__factory,
  Project,
  Project__factory,
  RIGHT,
  RIGHT__factory,
  SquareRootVoteCounter,
  SquareRootVoteCounter__factory,
  StableReserve,
  StableReserve__factory,
  StakeMining,
  StakeMiningPoolFactory__factory,
  StakeMining__factory,
  TeamShare,
  TeamShare__factory,
  TimelockedGovernance,
  TimelockedGovernance__factory,
  VISION,
  VisionEmitter,
  VisionEmitter__factory,
  VISION__factory,
  VotingEscrowLock,
  VotingEscrowLock__factory,
  WorkersUnion,
  WorkersUnion__factory,
} from "../src";

export interface TokenFixture {
  baseCurrency: ERC20Mock;
  vision: VISION;
  commit: COMMIT;
  project: Project;
  visionLP: IERC20;
  right: RIGHT;
}

export interface GovernanceFixture extends TokenFixture {
  veLocker: VotingEscrowLock;
  workersUnion: WorkersUnion;
  voteCounter: SquareRootVoteCounter;
  timelock: TimelockedGovernance;
  teamShare: TeamShare;
  dividendPool: DividendPool;
}

export interface MiningFixture extends GovernanceFixture {
  visionEmitter: VisionEmitter;
  commitMining: BurnMining;
  liquidityMining: StakeMining;
}

export interface AppFixture extends MiningFixture {
  jobBoard: JobBoard;
  stableReserve: StableReserve;
  marketplace: Marketplace;
}

export async function getTokenFixture(): Promise<TokenFixture> {
  const [deployer] = await ethers.getSigners();
  // 1. Get base currency. (In mainnet use DAI & for testing deploy new)
  const baseCurrency = await new ERC20Mock__factory(deployer).deploy();
  // 2. Deploy vision token
  const vision = await new VISION__factory(deployer).deploy();
  // 3. Deploy commit token
  const commit = await new COMMIT__factory(deployer).deploy();
  // 4. Deploy project token
  const project = await new Project__factory(deployer).deploy();
  // 5. Deploy uniswap pair
  const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
  const uniswapV2Factory = await UniswapV2Factory.deploy(deployer.address);
  await uniswapV2Factory.createPair(vision.address, WETH);
  const lpAddress = await uniswapV2Factory.getPair(vision.address, WETH);
  const visionLP = IERC20__factory.connect(lpAddress, deployer);
  // 6. Deploy RIGHT
  const right = await new RIGHT__factory(deployer).deploy(
    "https://workhard.finance/RIGHT/",
    vision.address
  );
  return {
    baseCurrency,
    vision,
    right,
    commit,
    project,
    visionLP,
  };
}

export async function getGovernanceFixture(): Promise<GovernanceFixture> {
  const [deployer] = await ethers.getSigners();
  const tokenFixture: TokenFixture = await getTokenFixture();
  // 6. Deploy team share
  const teamShare = await new TeamShare__factory(deployer).deploy();
  // 7. Deploy timelock contract
  const timelock = await new TimelockedGovernance__factory(deployer).deploy([
    deployer.address,
  ]);
  // 8. Get VotingEscrowLock
  const veLocker = VotingEscrowLock__factory.connect(
    await tokenFixture.right.veLocker(),
    deployer
  );
  // 9. Deploy dividend pool
  const dividendPool = await new DividendPool__factory(deployer).deploy(
    timelock.address,
    tokenFixture.right.address
  );
  // 9. Deploy vote counter
  const voteCounter = await new SquareRootVoteCounter__factory(deployer).deploy(
    tokenFixture.right.address
  );
  // 10. Deploy farmers union
  const workersUnion = await new WorkersUnion__factory(deployer).deploy(
    voteCounter.address,
    timelock.address
  );
  // 11. Transfer the timelock admin to the farmers union and renounce the executor role after 4 weeks
  await transferGovernance(timelock, workersUnion, deployer);
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
  const burnMiningFactory = await new BurnMiningPoolFactory__factory(
    deployer
  ).deploy();
  // 13. Deploy Stake Mining Factory
  const stakeMiningFactory = await new StakeMiningPoolFactory__factory(
    deployer
  ).deploy();
  // 14. Deploy Vision Token Emitter
  const visionEmitter = await new VisionEmitter__factory(deployer).deploy(
    governanceFixture.teamShare.address,
    governanceFixture.timelock.address,
    deployer.address,
    governanceFixture.vision.address,
    burnMiningFactory.address,
    stakeMiningFactory.address
  );
  // 15. Launch the visionLP liquidity mining pool
  await visionEmitter.newStakeMiningPool(governanceFixture.visionLP.address, {
    gasLimit: 2000000,
  });
  const liquidityMiningAddr = await visionEmitter.callStatic.stakeMiningPools(
    governanceFixture.visionLP.address
  );
  const liquidityMining = StakeMining__factory.connect(
    liquidityMiningAddr,
    deployer
  );
  // 16. Launch the commit burn mining pool
  await visionEmitter.newBurnMiningPool(governanceFixture.commit.address, {
    gasLimit: 2000000,
  });
  const commitMiningAddr = await visionEmitter.callStatic.burnMiningPools(
    governanceFixture.commit.address
  );
  const commitMining = BurnMining__factory.connect(commitMiningAddr, deployer);
  if (!option?.skipMinterSetting) {
    await setVisionMinter(governanceFixture.vision, visionEmitter, deployer);
    await transferGovernanceOfEmitter(
      visionEmitter,
      governanceFixture.timelock,
      deployer
    );
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
  const stableReserve = await new StableReserve__factory(deployer).deploy(
    miningFixture.timelock.address,
    miningFixture.commit.address,
    miningFixture.baseCurrency.address
  );
  // 18. Move Minter Permission to StableReserve
  await setCommitMinter(miningFixture.commit, stableReserve, deployer);
  // 19. Deploy Project Manager
  const jobBoard = await new JobBoard__factory(deployer).deploy(
    miningFixture.timelock.address,
    miningFixture.project.address,
    miningFixture.dividendPool.address,
    stableReserve.address,
    miningFixture.baseCurrency.address,
    ONE_INCH
  );
  // 20. Deploy Product Market
  const marketplace = await new Marketplace__factory(deployer).deploy(
    miningFixture.timelock.address,
    miningFixture.commit.address,
    miningFixture.dividendPool.address
  );
  // 21. Initialize Stable Reserve
  await initStableReserve(stableReserve, jobBoard, deployer);
  // 22. Initialize Dividend Pool
  await initDividendPool(
    miningFixture.dividendPool,
    jobBoard,
    marketplace,
    deployer
  );
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
