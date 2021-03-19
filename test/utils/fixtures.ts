import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { runTimelockTx } from "./utilities";

const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const ONE_INCH = "0x111111125434b319222CdBf8C261674aDB56F3ae";

export interface TokenFixture {
  visionToken: Contract;
  commitmentToken: Contract;
  visionLP: Contract;
}

export interface GovernanceFixture extends TokenFixture {
  farmersUnion: Contract;
  voteCounter: Contract;
  timelockedGovernance: Contract;
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
}

export const tokenFixture = async (signer: Signer): Promise<TokenFixture> => {
  const VisionToken = await ethers.getContractFactory("VisionToken", signer);
  const CommitmentToken = await ethers.getContractFactory(
    "CommitmentToken",
    signer
  );
  const visionToken = await VisionToken.deploy();
  const commitmentToken = await CommitmentToken.deploy();
  // deploy uniswap pair
  const uniswapV2Factory = await ethers.getContractAt(
    "IUniswapV2Factory",
    UNISWAP_FACTORY
  );
  await uniswapV2Factory.createPair(visionToken.address, WETH);
  const lpTokenAddress = await uniswapV2Factory.getPair(
    visionToken.address,
    WETH
  );
  const visionLP = await ethers.getContractAt("IERC20", lpTokenAddress);
  return {
    visionToken,
    commitmentToken,
    visionLP,
  };
};

export const governanceFixture = async (
  signer: Signer
): Promise<GovernanceFixture> => {
  const tokens = await tokenFixture(signer);
  const { visionToken } = tokens;
  // deploy dev timelock contract
  const TimelockedGovernance = await ethers.getContractFactory(
    "TimelockedGovernance",
    signer
  );
  const timelockedGovernance = await TimelockedGovernance.deploy([
    await signer.getAddress(),
  ]);

  // deploy vision farm
  const VisionFarm = await ethers.getContractFactory("VisionFarm", signer);
  const visionFarm = await VisionFarm.deploy(
    timelockedGovernance.address,
    visionToken.address
  );
  // deploy vote counter
  const SquareRootVoteCounter = await ethers.getContractFactory(
    "SquareRootVoteCounter",
    signer
  );
  const voteCounter = await SquareRootVoteCounter.deploy(visionFarm.address);
  // deploy Farmers union
  const FarmersUnion = await ethers.getContractFactory("FarmersUnion", signer);
  const farmersUnion = await FarmersUnion.deploy(
    visionFarm.address,
    voteCounter.address
  );
  return {
    ...tokens,
    farmersUnion,
    voteCounter,
    timelockedGovernance,
    visionFarm,
  };
};

export const miningFixture = async (
  signer: Signer,
  devAddr: string
): Promise<MiningFixture> => {
  const governance = await governanceFixture(signer);
  const {
    visionToken,
    commitmentToken,
    visionLP,
    timelockedGovernance,
  } = governance;

  const BurnMiningFactory = await ethers.getContractFactory(
    "BurnMiningPoolFactory",
    signer
  );
  const StakeMiningFactory = await ethers.getContractFactory(
    "StakeMiningPoolFactory",
    signer
  );
  const VisionTokenEmitter = await ethers.getContractFactory(
    "VisionTokenEmitter",
    signer
  );
  const burnMiningFactory = await BurnMiningFactory.deploy();
  const stakeMiningFactory = await StakeMiningFactory.deploy();
  const visionTokenEmitter = await VisionTokenEmitter.deploy(
    devAddr,
    timelockedGovernance.address,
    timelockedGovernance.address,
    visionToken.address,
    burnMiningFactory.address,
    stakeMiningFactory.address
  );
  // launch mining pools
  await visionTokenEmitter.newBurnMiningPool(commitmentToken.address);
  await visionTokenEmitter.newStakeMiningPool(visionLP.address);
  const commitmentMiningPoolAddr = await visionTokenEmitter.callStatic.burnMiningPools(
    commitmentToken.address
  );
  const liquidityMiningPoolAddr = await visionTokenEmitter.callStatic.stakeMiningPools(
    visionLP.address
  );
  // liquidity mining pool
  const commitmentMining = await ethers.getContractAt(
    "BurnMining",
    commitmentMiningPoolAddr
  );
  const liquidityMining = await ethers.getContractAt(
    "StakeMining",
    liquidityMiningPoolAddr
  );
  return {
    ...governance,
    visionTokenEmitter,
    commitmentMining,
    liquidityMining,
  };
};

export const appFixture = async (
  signer: Signer,
  devAddr: string
): Promise<AppFixture> => {
  const fixture = await miningFixture(signer, devAddr);
  const { visionFarm, timelockedGovernance, commitmentToken } = fixture;
  const LaborMarket = await ethers.getContractFactory("LaborMarket", signer);
  const laborMarket = await LaborMarket.deploy(
    timelockedGovernance.address,
    commitmentToken.address,
    DAI
  );
  const DealManager = await ethers.getContractFactory("DealManager", signer);
  const dealManager = await DealManager.deploy(
    timelockedGovernance.address,
    visionFarm.address,
    laborMarket.address,
    DAI,
    ONE_INCH
  );
  await runTimelockTx(
    timelockedGovernance,
    visionFarm.populateTransaction.addPlanter(dealManager.address)
  );
  const ProductMarket = await ethers.getContractFactory(
    "ProductMarket",
    signer
  );
  const ProductFactory = await ethers.getContractFactory(
    "ProductFactory",
    signer
  );
  const productFactory = await ProductFactory.deploy();
  const productMarket = await ProductMarket.deploy(
    timelockedGovernance.address,
    productFactory.address,
    commitmentToken.address,
    visionFarm.address
  );
  return {
    ...fixture,
    dealManager,
    laborMarket,
    productMarket,
  };
};
