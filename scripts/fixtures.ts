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
  WETH,
  ONE_INCH,
  transferGovernanceOfEmitter,
} from "./utils/deployer";
import {
  COMMIT,
  COMMIT__factory,
  DividendPool,
  DividendPool__factory,
  ERC20,
  ERC20__factory,
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
  TeamShare,
  TeamShare__factory,
  TeamSharePool,
  TeamSharePool__factory,
  ERC20BurnMiningV1,
  ERC20BurnMiningV1__factory,
  ERC20BurnMiningV1Factory,
  ERC20BurnMiningV1Factory__factory,
  ERC20StakeMiningV1,
  ERC20StakeMiningV1__factory,
  ERC20StakeMiningV1Factory,
  ERC20StakeMiningV1Factory__factory,
  ERC721StakeMiningV1,
  ERC721StakeMiningV1__factory,
  ERC721StakeMiningV1Factory,
  ERC721StakeMiningV1Factory__factory,
  ERC1155StakeMiningV1,
  ERC1155StakeMiningV1__factory,
  ERC1155StakeMiningV1Factory,
  ERC1155StakeMiningV1Factory__factory,
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
  baseCurrency: ERC20;
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
  teamSharePool: TeamSharePool;
  dividendPool: DividendPool;
}

export interface MiningFixture extends GovernanceFixture {
  visionEmitter: VisionEmitter;
  commitMining: ERC20BurnMiningV1;
  liquidityMining: ERC20StakeMiningV1;
  erc20BurnMiningV1Factory: ERC20BurnMiningV1Factory;
  erc20StakeMiningV1Factory: ERC20StakeMiningV1Factory;
  erc721StakeMiningV1Factory: ERC721StakeMiningV1Factory;
  erc1155StakeMiningV1Factory: ERC1155StakeMiningV1Factory;
}

export interface AppFixture extends MiningFixture {
  jobBoard: JobBoard;
  stableReserve: StableReserve;
  marketplace: Marketplace;
}

export async function getTokenFixture(): Promise<TokenFixture> {
  const [deployer] = await ethers.getSigners();
  // 1. Get base currency. (In mainnet use DAI & for testing deploy new)
  const baseCurrency = ERC20__factory.connect(
    (
      await (
        await ethers.getContractFactory("contracts/utils/ERC20Mock.sol:ERC20")
      ).deploy()
    ).address,
    deployer
  );
  // 2. Deploy vision token
  const vision = VISION__factory.connect(
    (await (await ethers.getContractFactory("VISION")).deploy()).address,
    deployer
  );
  // 3. Deploy commit token
  const commit = COMMIT__factory.connect(
    (await (await ethers.getContractFactory("COMMIT")).deploy()).address,
    deployer
  );
  // 4. Deploy project token
  const project = Project__factory.connect(
    (await (await ethers.getContractFactory("Project")).deploy()).address,
    deployer
  );
  // 5. Deploy uniswap pair
  const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
  const uniswapV2Factory = await UniswapV2Factory.deploy(deployer.address);
  await uniswapV2Factory.createPair(vision.address, WETH);
  const lpAddress = await uniswapV2Factory.getPair(vision.address, WETH);
  const visionLP = IERC20__factory.connect(lpAddress, deployer);
  // 6. Deploy RIGHT
  const right = RIGHT__factory.connect(
    (
      await (
        await ethers.getContractFactory("RIGHT")
      ).deploy("https://workhard.finance/RIGHT/", vision.address)
    ).address,
    deployer
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
  // 7. Deploy team share
  const teamShare = TeamShare__factory.connect(
    (await (await ethers.getContractFactory("TeamShare")).deploy()).address,
    deployer
  );
  // 8. Deploy team share pool
  const teamSharePool = TeamSharePool__factory.connect(
    (
      await (
        await ethers.getContractFactory("TeamSharePool")
      ).deploy(teamShare.address)
    ).address,
    deployer
  );

  // 9. Deploy timelock contract
  const timelock = TimelockedGovernance__factory.connect(
    (
      await (
        await ethers.getContractFactory("TimelockedGovernance")
      ).deploy([deployer.address])
    ).address,
    deployer
  );
  // 10. Get VotingEscrowLock
  const veLocker = VotingEscrowLock__factory.connect(
    await tokenFixture.right.veLocker(),
    deployer
  );
  // 11. Deploy dividend pool
  const dividendPool = DividendPool__factory.connect(
    (
      await (
        await ethers.getContractFactory("DividendPool")
      ).deploy(timelock.address, tokenFixture.right.address)
    ).address,
    deployer
  );
  // 12. Deploy vote counter
  const voteCounter = SquareRootVoteCounter__factory.connect(
    (
      await (
        await ethers.getContractFactory("SquareRootVoteCounter")
      ).deploy(tokenFixture.right.address)
    ).address,
    deployer
  );
  // 13. Deploy Workers Union
  const workersUnion = WorkersUnion__factory.connect(
    (
      await (
        await ethers.getContractFactory("WorkersUnion")
      ).deploy(voteCounter.address, timelock.address)
    ).address,
    deployer
  );

  // TODO => 37. Transfer the timelock admin to the farmers union and renounce the executor role after 4 weeks
  await transferGovernance(timelock, workersUnion, deployer);
  return {
    ...tokenFixture,
    teamShare,
    teamSharePool,
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
  // 14. Deploy ERC20BurnMiningV1Factory
  const erc20BurnMiningV1Factory = ERC20BurnMiningV1Factory__factory.connect(
    (
      await (
        await ethers.getContractFactory("ERC20BurnMiningV1Factory")
      ).deploy()
    ).address,
    deployer
  );
  // 15. Deploy ERC20StakeMiningV1Factory
  const erc20StakeMiningV1Factory = ERC20StakeMiningV1Factory__factory.connect(
    (
      await (
        await ethers.getContractFactory("ERC20StakeMiningV1Factory")
      ).deploy()
    ).address,
    deployer
  );
  // 16. Deploy ERC721StakeMiningV1Factory
  const erc721StakeMiningV1Factory =
    ERC721StakeMiningV1Factory__factory.connect(
      (
        await (
          await ethers.getContractFactory("ERC721StakeMiningV1Factory")
        ).deploy()
      ).address,
      deployer
    );
  // 17. Deploy ERC1155StakeMiningV1Factory
  const erc1155StakeMiningV1Factory =
    ERC1155StakeMiningV1Factory__factory.connect(
      (
        await (
          await ethers.getContractFactory("ERC1155StakeMiningV1Factory")
        ).deploy()
      ).address,
      deployer
    );
  // 18. Deploy Vision Token Emitter
  const visionEmitter = VisionEmitter__factory.connect(
    (
      await (
        await ethers.getContractFactory("VisionEmitter")
      ).deploy(
        governanceFixture.teamSharePool.address,
        governanceFixture.timelock.address,
        deployer.address,
        governanceFixture.vision.address
      )
    ).address,
    deployer
  );
  // 19. Initialize Team Share Pool
  await governanceFixture.teamSharePool.initialize(
    visionEmitter.address,
    governanceFixture.teamShare.address,
    governanceFixture.timelock.address
  );

  // 20. add ERC20BurnMiningV1Factory
  await visionEmitter.setFactory(erc20BurnMiningV1Factory.address);
  // 21. add ERC20StakeMiningV1Factory
  await visionEmitter.setFactory(erc20StakeMiningV1Factory.address);
  // 22. add ERC721StakeMiningV1Factory
  await visionEmitter.setFactory(erc721StakeMiningV1Factory.address);
  // 23. add ERC1155StakeMiningV1Factory
  await visionEmitter.setFactory(erc1155StakeMiningV1Factory.address);

  // 24. Launch the visionLP liquidity mining pool
  const erc20StakeMiningV1SigHash = await erc20StakeMiningV1Factory.poolSig();
  await visionEmitter.newPool(
    erc20StakeMiningV1SigHash,
    governanceFixture.visionLP.address,
    {
      gasLimit: 2000000,
    }
  );

  // 25. Launch the  commit mining pool
  const erc20BurnMiningV1SigHash = await erc20BurnMiningV1Factory.poolSig();
  await visionEmitter.newPool(
    erc20BurnMiningV1SigHash,
    governanceFixture.commit.address,
    {
      gasLimit: 2000000,
    }
  );
  const liquidityMiningPoolAddr = await erc20StakeMiningV1Factory.poolAddress(
    visionEmitter.address,
    governanceFixture.visionLP.address
  );
  const liquidityMining = ERC20StakeMiningV1__factory.connect(
    liquidityMiningPoolAddr,
    deployer
  );
  const commitMiningPoolAddr = await erc20BurnMiningV1Factory.poolAddress(
    visionEmitter.address,
    governanceFixture.commit.address
  );
  const commitMining = ERC20BurnMiningV1__factory.connect(
    commitMiningPoolAddr,
    deployer
  );
  if (!option?.skipMinterSetting) {
    // 27. set vision minter
    await setVisionMinter(governanceFixture.vision, visionEmitter, deployer);
    // 28. transfer emitter governance to timelock
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
    erc20BurnMiningV1Factory,
    erc20StakeMiningV1Factory,
    erc721StakeMiningV1Factory,
    erc1155StakeMiningV1Factory,
  };
}

export async function getAppFixture(): Promise<AppFixture> {
  const [deployer] = await ethers.getSigners();
  const miningFixture: MiningFixture = await getMiningFixture();
  // 29. Deploy Stable Reserve
  const stableReserve = StableReserve__factory.connect(
    (
      await (
        await ethers.getContractFactory("StableReserve")
      ).deploy(
        miningFixture.timelock.address,
        miningFixture.commit.address,
        miningFixture.baseCurrency.address
      )
    ).address,
    deployer
  );
  // 30. Move Minter Permission to StableReserve
  await setCommitMinter(miningFixture.commit, stableReserve, deployer);
  // 31. Deploy JobBoard
  const jobBoard = JobBoard__factory.connect(
    (
      await (
        await ethers.getContractFactory("JobBoard")
      ).deploy(
        miningFixture.timelock.address,
        miningFixture.project.address,
        miningFixture.dividendPool.address,
        stableReserve.address,
        miningFixture.baseCurrency.address,
        ONE_INCH
      )
    ).address,
    deployer
  );
  // 32. Deploy ERC1155 Marketplace
  const marketplace = Marketplace__factory.connect(
    (
      await (
        await ethers.getContractFactory("Marketplace")
      ).deploy(
        miningFixture.timelock.address,
        miningFixture.commit.address,
        miningFixture.dividendPool.address
      )
    ).address,
    deployer
  );
  // 33. Initialize Stable Reserve
  await initStableReserve(stableReserve, jobBoard, deployer);
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
