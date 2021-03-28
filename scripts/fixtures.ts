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
  dealManager: Contract;
  laborMarket: Contract;
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
  const visionLP = await deployUniswapLP(visionToken.address, WETH);
  record(hre.network.name as MyNetwork, "VisionLP", visionLP.address);
  return { stableCoin, visionToken, commitmentToken, visionLP };
}

export async function getGovernanceFixture(): Promise<GovernanceFixture> {
  const [deployer] = await ethers.getSigners();
  const tokenFixture: TokenFixture = await getTokenFixture();
  const { visionToken } = tokenFixture;
  // 5. Deploy team share
  const teamShare = await autoDeploy("TeamShare");
  // 6. Deploy timelock contract
  const timelock = await autoDeploy("TimelockedGovernance", [deployer.address]);
  // 7. Deploy vision farm
  const visionFarm = await autoDeploy(
    "VisionFarm",
    timelock.address,
    visionToken.address
  );
  // 8. Deploy vote counter
  const voteCounter = await autoDeploy(
    "SquareRootVoteCounter",
    visionFarm.address
  );
  // 9. Deploy farmers union
  const farmersUnion = await autoDeploy(
    "FarmersUnion",
    visionFarm.address,
    voteCounter.address
  );
  // 10. Transfer the timelock admin to the farmers union and renounce the executor role after 4 weeks
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
  // 11. Deploy Burn Mining Factory
  const burnMiningFactory = await autoDeploy("BurnMiningPoolFactory");
  // 12. Deploy Stake Mining Factory
  const stakeMiningFactory = await autoDeploy("StakeMiningPoolFactory");
  // 13. Deploy Vision Token Emitter
  const visionTokenEmitter = await autoDeploy(
    "VisionTokenEmitter",
    teamShare.address,
    timelock.address,
    timelock.address,
    visionToken.address,
    burnMiningFactory.address,
    stakeMiningFactory.address
  );
  // 14. Launch the visionLP liquidity mining pool
  const liquidityMining = await launchStakeMiningPool(
    visionTokenEmitter,
    visionLP.address
  );
  record(
    hre.network.name as MyNetwork,
    "LiquidityMining",
    liquidityMining.address
  );
  // 15. Launch the commitment burn mining pool
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
  // 16. Deploy Labor Market
  const { timelock, commitmentToken, stableCoin, visionFarm } = miningFixture;
  const laborMarket = await autoDeploy(
    "LaborMarket",
    timelock.address,
    commitmentToken.address,
    stableCoin.address
  );
  // 17. Move Minter Permission to LaborMarket
  await commitmentToken.setMinter(laborMarket.address);
  // 18. Deploy Deal Manager
  const dealManager = await autoDeploy(
    "DealManager",
    timelock.address,
    visionFarm.address,
    laborMarket.address,
    stableCoin.address,
    ONE_INCH
  );
  // 19. Deploy Product Factory
  const productFactory = await autoDeploy("ProductFactory");
  // 20. Deploy Product Market
  const productMarket = await autoDeploy(
    "ProductMarket",
    timelock.address,
    productFactory.address,
    commitmentToken.address,
    visionFarm.address
  );
  // 21. Initialize Labor Market
  await laborMarket.init(dealManager.address);
  // 22. Initialize Vision Farm
  await visionFarm.init(dealManager.address, productMarket.address);
  return {
    ...miningFixture,
    dealManager,
    laborMarket,
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
    laborMarket: await getDeployedContract(deployed, "LaborMarket"),
    dealManager: await getDeployedContract(deployed, "DealManager"),
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
    commitmentToken: await getDeployedContract(deployed, "CommitmentToken"),
    visionToken: await getDeployedContract(deployed, "VisionToken"),
    stableCoin: await getDeployedContract(deployed, "StableCoin"),
  };
  return fixture;
}
