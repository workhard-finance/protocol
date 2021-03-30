// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { Contract } from "ethers";
import { deployUniswapLP } from "./helpers/deploy-uniswap-v2-pair";

import {
  autoDeploy,
  getDeployed,
  getDeployedContract,
  record,
} from "./utils/deployer";
import { scheduleGovernanceTransfer } from "./helpers/transfer-governance";
import { launchStakeMiningPool } from "./helpers/launch-stake-mining-pool";
import { launchBurnMiningPool } from "./helpers/launch-burn-mining-pool";
import { getBaseCurrency } from "./helpers/get-base-currency";
import { MyNetwork } from "./utils/types/network";

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const ONE_INCH = "0x111111125434b319222CdBf8C261674aDB56F3ae";

export interface TokenFixture {
  stableCoin: Contract;
  visionToken: Contract;
  commitmentToken: Contract;
  projectToken: Contract;
  visionLP: Contract;
}

export interface GovernanceFixture extends TokenFixture {
  farmersUnion: Contract;
  voteCounter: Contract;
  timelock: Contract;
  teamShare: Contract;
  visionFarm: Contract;
}

export interface MiningFixture extends GovernanceFixture {
  visionTokenEmitter: Contract;
  commitmentMining: Contract;
  liquidityMining: Contract;
}

export interface AppFixture extends MiningFixture {
  projManager: Contract;
  cryptoJobBoard: Contract;
  productMarket: Contract;
  productFactory: Contract;
}

export async function getTokenFixture(): Promise<TokenFixture> {
  const [deployer] = await ethers.getSigners();
  // 1. Get base currency. (In mainnet use DAI & for testing deploy new)
  const stableCoin = await getBaseCurrency(deployer.address);
  record(hre.network.name as MyNetwork, "StableCoin", stableCoin.address);
  // 2. Deploy vision token
  const visionToken = await autoDeploy("VisionToken");
  // 3. Deploy commitment token
  const commitmentToken = await autoDeploy("CommitmentToken");
  // 4. Deploy uniswap pair
  const project = await autoDeploy("Project");
  // 5. Deploy uniswap pair
  const visionLP = await deployUniswapLP(visionToken.address, WETH);
  record(hre.network.name as MyNetwork, "VisionLP", visionLP.address);
  return {
    stableCoin,
    visionToken,
    commitmentToken,
    projectToken: project,
    visionLP,
  };
}

export async function getGovernanceFixture(): Promise<GovernanceFixture> {
  const [deployer] = await ethers.getSigners();
  const tokenFixture: TokenFixture = await getTokenFixture();
  const { visionToken } = tokenFixture;
  // 6. Deploy team share
  const teamShare = await autoDeploy("TeamShare");
  // 7. Deploy timelock contract
  const timelock = await autoDeploy("TimelockedGovernance", [deployer.address]);
  // 8. Deploy vision farm
  const visionFarm = await autoDeploy(
    "VisionFarm",
    timelock.address,
    visionToken.address
  );
  // 9. Deploy vote counter
  const voteCounter = await autoDeploy(
    "SquareRootVoteCounter",
    visionFarm.address
  );
  // 10. Deploy farmers union
  const farmersUnion = await autoDeploy(
    "FarmersUnion",
    visionFarm.address,
    voteCounter.address
  );
  // 11. Transfer the timelock admin to the farmers union and renounce the executor role after 4 weeks
  await scheduleGovernanceTransfer(
    timelock,
    farmersUnion.address,
    deployer.address
  );
  return {
    ...tokenFixture,
    teamShare,
    farmersUnion,
    voteCounter,
    timelock,
    visionFarm,
  };
}

export async function getMiningFixture(): Promise<MiningFixture> {
  const governanceFixture: GovernanceFixture = await getGovernanceFixture();
  const {
    teamShare,
    timelock,
    visionToken,
    visionLP,
    commitmentToken,
    stableCoin,
  } = governanceFixture;
  // 12. Deploy Burn Mining Factory
  const burnMiningFactory = await autoDeploy("BurnMiningPoolFactory");
  // 13. Deploy Stake Mining Factory
  const stakeMiningFactory = await autoDeploy("StakeMiningPoolFactory");
  // 14. Deploy Vision Token Emitter
  const visionTokenEmitter = await autoDeploy(
    "VisionTokenEmitter",
    teamShare.address,
    timelock.address,
    timelock.address,
    visionToken.address,
    burnMiningFactory.address,
    stakeMiningFactory.address
  );
  // 15. Launch the visionLP liquidity mining pool
  const liquidityMining = await launchStakeMiningPool(
    visionTokenEmitter,
    visionLP.address
  );
  record(
    hre.network.name as MyNetwork,
    "LiquidityMining",
    liquidityMining.address
  );
  // 16. Launch the commitment burn mining pool
  const commitmentMining = await launchBurnMiningPool(
    visionTokenEmitter,
    commitmentToken.address
  );
  record(
    hre.network.name as MyNetwork,
    "CommitmentMining",
    commitmentMining.address
  );
  return {
    ...governanceFixture,
    visionTokenEmitter,
    commitmentMining,
    liquidityMining,
  };
}

export async function getAppFixture(): Promise<AppFixture> {
  const miningFixture: MiningFixture = await getMiningFixture();
  // 17. Deploy Labor Market
  const {
    timelock,
    projectToken,
    commitmentToken,
    stableCoin,
    visionFarm,
  } = miningFixture;
  const cryptoJobBoard = await autoDeploy(
    "CryptoJobBoard",
    timelock.address,
    commitmentToken.address,
    projectToken.address,
    stableCoin.address
  );
  // 18. Move Minter Permission to CryptoJobBoard
  await commitmentToken.setMinter(cryptoJobBoard.address);
  // 19. Deploy Project Manager
  const projManager = await autoDeploy(
    "ProjectManager",
    timelock.address,
    projectToken.address,
    visionFarm.address,
    cryptoJobBoard.address,
    stableCoin.address,
    ONE_INCH
  );
  // 20. Deploy Product Factory
  const productFactory = await autoDeploy("ProductFactory");
  // 21. Deploy Product Market
  const productMarket = await autoDeploy(
    "ProductMarket",
    timelock.address,
    productFactory.address,
    commitmentToken.address,
    visionFarm.address
  );
  // 22. Initialize Labor Market
  await cryptoJobBoard.init(projManager.address);
  // 23. Initialize Vision Farm
  await visionFarm.init(projManager.address, productMarket.address);
  return {
    ...miningFixture,
    projManager,
    cryptoJobBoard,
    productFactory,
    productMarket,
  };
}

export async function deployAndGetFixtures(): Promise<AppFixture> {
  const appFixture = await getAppFixture();
  return appFixture;
}

export async function getDeployedFixtures(): Promise<AppFixture> {
  const deployed = getDeployed();
  const fixture: AppFixture = {
    productFactory: await getDeployedContract(deployed, "ProductFactory"),
    productMarket: await getDeployedContract(deployed, "ProductMarket"),
    cryptoJobBoard: await getDeployedContract(deployed, "CryptoJobBoard"),
    projManager: await getDeployedContract(deployed, "ProjectManager"),
    liquidityMining: await getDeployedContract(deployed, "LiquidityMining"),
    commitmentMining: await getDeployedContract(deployed, "CommitmentMining"),
    visionTokenEmitter: await getDeployedContract(
      deployed,
      "VisionTokenEmitter"
    ),
    visionFarm: await getDeployedContract(deployed, "VisionFarm"),
    teamShare: await getDeployedContract(deployed, "TeamShare"),
    timelock: await getDeployedContract(deployed, "TimelockedGovernance"),
    voteCounter: await getDeployedContract(deployed, "SquareRootVoteCounter"),
    farmersUnion: await getDeployedContract(deployed, "FarmersUnion"),
    visionLP: await getDeployedContract(deployed, "VisionLP"),
    projectToken: await getDeployedContract(deployed, "Project"),
    commitmentToken: await getDeployedContract(deployed, "CommitmentToken"),
    visionToken: await getDeployedContract(deployed, "VisionToken"),
    stableCoin: await getDeployedContract(deployed, "StableCoin"),
  };
  return fixture;
}
