// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { Contract } from "ethers";
import { deployUniswapLP } from "./helpers/deploy-uniswap-v2-pair";

import { autoDeploy, record } from "./utils/deployer";
import { scheduleGovernanceTransfer } from "./helpers/transfer-governance";
import { launchStakeMiningPool } from "./helpers/launch-stake-mining-pool";
import { launchBurnMiningPool } from "./helpers/launch-burn-mining-pool";
import { getBaseCurrency } from "./helpers/get-base-currency";
import { MyNetwork } from "../deployed";

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const ONE_INCH = "0x111111125434b319222CdBf8C261674aDB56F3ae";

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
  const baseCurrency = await getBaseCurrency(deployer.address);
  record(hre.network.name as MyNetwork, "BaseCurrency", baseCurrency.address);
  // 2. Deploy vision token
  const vision = await autoDeploy("VISION");
  // 3. Deploy commit token
  const commitToken = await autoDeploy("COMMIT");
  // 4. Deploy uniswap pair
  const project = await autoDeploy("Project");
  // 5. Deploy uniswap pair
  const visionLP = await deployUniswapLP(vision.address, WETH);
  // 6. Deploy RIGHT
  const veVISION = await autoDeploy(
    "RIGHT",
    "https://workhard.finance/RIGHT/",
    vision.address
  );
  record(hre.network.name as MyNetwork, "VisionLP", visionLP.address);
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
  const { vision, veVISION } = tokenFixture;
  // 6. Deploy team share
  const teamShare = await autoDeploy("TeamShare");
  // 7. Deploy timelock contract
  const timelock = await autoDeploy("TimelockedGovernance", [deployer.address]);
  const veLocker = await ethers.getContractAt(
    "VotingEscrowLock",
    await veVISION.callStatic.veLocker()
  );
  // 9. Deploy dividend pool
  const dividendPool = await autoDeploy(
    "DividendPool",
    timelock.address,
    veVISION.address
  );
  // 9. Deploy vote counter
  const voteCounter = await autoDeploy(
    "SquareRootVoteCounter",
    veVISION.address
  );
  // 10. Deploy farmers union
  const workersUnion = await autoDeploy(
    "WorkersUnion",
    voteCounter.address,
    timelock.address
  );
  // 11. Transfer the timelock admin to the farmers union and renounce the executor role after 4 weeks
  await scheduleGovernanceTransfer(
    timelock,
    workersUnion.address,
    deployer.address
  );
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
  const governanceFixture: GovernanceFixture = await getGovernanceFixture();
  const {
    teamShare,
    timelock,
    vision,
    visionLP,
    commitToken,
  } = governanceFixture;
  // 12. Deploy Burn Mining Factory
  const burnMiningFactory = await autoDeploy("BurnMiningPoolFactory");
  // 13. Deploy Stake Mining Factory
  const stakeMiningFactory = await autoDeploy("StakeMiningPoolFactory");
  // 14. Deploy Vision Token Emitter
  const visionEmitter = await autoDeploy(
    "VisionEmitter",
    teamShare.address,
    timelock.address,
    timelock.address,
    vision.address,
    burnMiningFactory.address,
    stakeMiningFactory.address
  );
  // 15. Launch the visionLP liquidity mining pool
  const liquidityMining = await launchStakeMiningPool(
    visionEmitter,
    visionLP.address
  );
  record(
    hre.network.name as MyNetwork,
    "LiquidityMining",
    liquidityMining.address
  );
  // 16. Launch the commit burn mining pool
  const commitMining = await launchBurnMiningPool(
    visionEmitter,
    commitToken.address
  );
  const [deployer] = await ethers.getSigners();
  record(hre.network.name as MyNetwork, "CommitMining", commitMining.address);
  if (!option?.skipMinterSetting) {
    await vision.connect(deployer).setMinter(visionEmitter.address);
  }
  return {
    ...governanceFixture,
    visionEmitter,
    commitMining,
    liquidityMining,
  };
}

export async function getAppFixture(): Promise<AppFixture> {
  const miningFixture: MiningFixture = await getMiningFixture();
  // 17. Deploy Labor Market
  const {
    timelock,
    projectToken,
    commitToken,
    baseCurrency,
    dividendPool,
  } = miningFixture;
  const stableReserve = await autoDeploy(
    "StableReserve",
    timelock.address,
    commitToken.address,
    baseCurrency.address
  );
  // 18. Move Minter Permission to StableReserve
  await commitToken.setMinter(stableReserve.address);
  // 19. Deploy Project Manager
  const jobBoard = await autoDeploy(
    "JobBoard",
    timelock.address,
    projectToken.address,
    dividendPool.address,
    stableReserve.address,
    baseCurrency.address,
    ONE_INCH
  );
  // 20. Deploy Product Market
  const marketplace = await autoDeploy(
    "Marketplace",
    timelock.address,
    commitToken.address,
    dividendPool.address
  );
  // 21. Initialize Labor Market
  await stableReserve.init(jobBoard.address);
  // 22. Initialize Vision Farm
  await dividendPool.init(jobBoard.address, marketplace.address);
  return {
    ...miningFixture,
    jobBoard: jobBoard,
    stableReserve,
    marketplace,
  };
}

export async function deployAndGetFixtures(): Promise<AppFixture> {
  const appFixture = await getAppFixture();
  return appFixture;
}
