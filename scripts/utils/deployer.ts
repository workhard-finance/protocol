import hre, { ethers } from "hardhat";
import { Contract, Signer, constants } from "ethers";

import { autoDeploy, getDB, getRoleHash, record } from "./helper";
import { deployed, MyNetwork } from "../../deployed";

import {
  BurnMining,
  BurnMiningPoolFactory,
  BurnMiningPoolFactory__factory,
  BurnMining__factory,
  COMMIT,
  COMMIT__factory,
  DividendPool,
  DividendPool__factory,
  ERC20Mock__factory,
  IERC20,
  IERC20__factory,
  JobBoard,
  JobBoard__factory,
  Marketplace,
  Marketplace__factory,
  Project,
  Project__factory,
  StableReserve,
  StableReserve__factory,
  StakeMining,
  StakeMiningPoolFactory,
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
  VoteCounter,
  VoteCounter__factory,
  VotingEscrowLock,
  VotingEscrowLock__factory,
  VotingEscrowToken,
  VotingEscrowToken__factory,
  WorkersUnion,
  WorkersUnion__factory,
} from "../../src";
import { isAddress } from "ethers/lib/utils";

export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const ONE_INCH = "0x111111125434b319222CdBf8C261674aDB56F3ae";
const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

export async function getBaseCurrency(signer: Signer): Promise<IERC20> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = await getDB();
  const deployedAddress = await deployed.get(`${network}.BaseCurrency`).value();
  let stablecoin: string;
  if (deployedAddress) {
    stablecoin = deployedAddress;
  } else if (network === "rinkeby") {
    // rinkeby DAI
    stablecoin = "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea";
  } else if (network === "mainnet") {
    // mainnet DAI
    stablecoin = "0x6b175474e89094c44da98b954eedeac495271d0f";
  } else {
    // deploy!
    const mockERC20 = await new ERC20Mock__factory(signer).deploy();
    stablecoin = mockERC20.address;
  }
  record(hre.network.name as MyNetwork, "BaseCurrency", stablecoin);
  return IERC20__factory.connect(stablecoin, signer);
}

export async function getVision(signer: Signer): Promise<VISION> {
  const vision = await autoDeploy("VISION");
  return VISION__factory.connect(vision.address, signer);
}

export async function getCommit(signer: Signer): Promise<COMMIT> {
  const commit = await autoDeploy("COMMIT");
  return COMMIT__factory.connect(commit.address, signer);
}

export async function getProject(signer: Signer): Promise<Project> {
  const project = await autoDeploy("Project");
  return Project__factory.connect(project.address, signer);
}

export async function getVisionETHLP(signer: Signer): Promise<IERC20> {
  const vision = await getVision(signer);
  const network = hre.network.name as MyNetwork;
  let lpAddress: string;
  const deployed = await getDB();
  const deployedAddress = await deployed.get(`${network}.VisionLP`).value();
  let uniswapV2Factory: Contract;
  if (deployedAddress) {
    lpAddress = deployedAddress;
  } else {
    if (["mainnet", "rinkeby"].includes(network)) {
      uniswapV2Factory = await ethers.getContractAt(
        "IUniswapV2Factory",
        UNISWAP_FACTORY
      );
    } else {
      const UniswapV2Factory = await ethers.getContractFactory(
        "UniswapV2Factory"
      );
      uniswapV2Factory = await UniswapV2Factory.deploy(
        await signer.getAddress()
      );
    }
    console.log("fac", uniswapV2Factory.address);
    let deployedLP = await uniswapV2Factory.getPair(vision.address, WETH);
    console.log("deployed", deployedLP);
    if (deployedLP === constants.AddressZero) {
      await uniswapV2Factory.createPair(vision.address, WETH);
      deployedLP = await uniswapV2Factory.getPair(vision.address, WETH);
    }
    lpAddress = deployedLP;
  }
  record(hre.network.name as MyNetwork, "VisionLP", lpAddress);
  return IERC20__factory.connect(lpAddress, signer);
}

export async function getRight(signer: Signer): Promise<VotingEscrowToken> {
  const vision = await getVision(signer);
  const right = await autoDeploy(
    "RIGHT",
    "https://workhard.finance/RIGHT/",
    vision.address
  );
  return VotingEscrowToken__factory.connect(right.address, signer);
}

export async function getTeamShare(signer: Signer): Promise<TeamShare> {
  const teamShare = await autoDeploy("TeamShare");
  return TeamShare__factory.connect(teamShare.address, signer);
}

export async function getTimelockedGovernance(
  signer: Signer
): Promise<TimelockedGovernance> {
  const tg = await autoDeploy("TimelockedGovernance", [
    await signer.getAddress(),
  ]);
  return TimelockedGovernance__factory.connect(tg.address, signer);
}

export async function getVeLocker(signer: Signer): Promise<VotingEscrowLock> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = await getDB();
  const deployedAddress = await deployed
    .get(`${network}.VotingEscrowLock`)
    .value();
  let veLockAddr: string;
  if (deployedAddress) {
    veLockAddr = deployedAddress;
  } else {
    const veVISION = await getRight(signer);
    veLockAddr = await veVISION.veLocker();
    record(hre.network.name as MyNetwork, "VotingEscrowLock", veLockAddr);
  }
  return VotingEscrowLock__factory.connect(veLockAddr, signer);
}

export async function getDividendPool(signer: Signer): Promise<DividendPool> {
  const timelock = await getTimelockedGovernance(signer);
  const veVISION = await getRight(signer);
  const dividendPool = await autoDeploy(
    "DividendPool",
    timelock.address,
    veVISION.address
  );
  return DividendPool__factory.connect(dividendPool.address, signer);
}

export async function getVoteCounter(signer: Signer): Promise<VoteCounter> {
  const veVISION = await getRight(signer);
  const voteCounter = await autoDeploy(
    "SquareRootVoteCounter",
    veVISION.address
  );
  return VoteCounter__factory.connect(voteCounter.address, signer);
}

export async function getWorkersUnion(signer: Signer): Promise<WorkersUnion> {
  const voteCounter = await getVoteCounter(signer);
  const timelock = await getTimelockedGovernance(signer);
  const workersUnion = await autoDeploy(
    "WorkersUnion",
    voteCounter.address,
    timelock.address
  );
  return WorkersUnion__factory.connect(workersUnion.address, signer);
}

export async function getBurnMiningFactory(
  signer: Signer
): Promise<BurnMiningPoolFactory> {
  const burnMiningPoolFactory = await autoDeploy("BurnMiningPoolFactory");
  return BurnMiningPoolFactory__factory.connect(
    burnMiningPoolFactory.address,
    signer
  );
}

export async function getStakeMiningFactory(
  signer: Signer
): Promise<StakeMiningPoolFactory> {
  const stakeMiningPoolFactory = await autoDeploy("StakeMiningPoolFactory");
  return StakeMiningPoolFactory__factory.connect(
    stakeMiningPoolFactory.address,
    signer
  );
}

export async function getVisionEmitter(signer: Signer): Promise<VisionEmitter> {
  const teamShare = await getTeamShare(signer);
  const timelock = await getTimelockedGovernance(signer);
  const vision = await getVision(signer);
  const burnMiningFactory = await getBurnMiningFactory(signer);
  const stakeMiningFactory = await getStakeMiningFactory(signer);
  const visionEmitter = await autoDeploy(
    "VisionEmitter",
    teamShare.address,
    timelock.address,
    await signer.getAddress(),
    vision.address,
    burnMiningFactory.address,
    stakeMiningFactory.address
  );
  return VisionEmitter__factory.connect(visionEmitter.address, signer);
}

export async function getLiquidityMining(signer: Signer): Promise<StakeMining> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = await getDB();
  const deployedAddress = await deployed
    .get(`${network}.LiquidityMining`)
    .value();
  let poolAddr: string;
  if (deployedAddress) {
    poolAddr = deployedAddress;
  } else {
    const visionEmitter = await getVisionEmitter(signer);
    const visionEthLP = await getVisionETHLP(signer);
    await visionEmitter.newStakeMiningPool(visionEthLP.address, {
      gasLimit: 2000000,
    });
    poolAddr = await visionEmitter.callStatic.stakeMiningPools(
      visionEthLP.address
    );
    record(hre.network.name as MyNetwork, "LiquidityMining", poolAddr);
  }
  return StakeMining__factory.connect(poolAddr, signer);
}

export async function getCommitMining(signer: Signer): Promise<BurnMining> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = await getDB();
  const deployedAddress = await deployed.get(`${network}.CommitMining`).value();
  let poolAddr: string;
  if (deployedAddress) {
    poolAddr = deployedAddress;
  } else {
    const visionEmitter = await getVisionEmitter(signer);
    const commit = await getCommit(signer);
    await visionEmitter.newBurnMiningPool(commit.address, {
      gasLimit: 2000000,
    });
    poolAddr = await visionEmitter.callStatic.burnMiningPools(commit.address);
    record(hre.network.name as MyNetwork, "CommitMining", poolAddr);
  }
  return BurnMining__factory.connect(poolAddr, signer);
}

export async function setEmissionRate(signer: Signer): Promise<void> {
  const liquidityMining = await getLiquidityMining(signer);
  const commitMining = await getCommitMining(signer);
  const visionEmitter = await getVisionEmitter(signer);
  await visionEmitter
    .connect(signer)
    .setEmission(
      [liquidityMining.address, commitMining.address],
      [4745, 4745],
      499,
      1
    );
}

export async function setVisionMinter(
  vision: VISION,
  visionEmitter: VisionEmitter,
  signer: Signer
): Promise<void> {
  await vision.connect(signer).setMinter(visionEmitter.address);
}

export async function transferGovernanceOfEmitter(
  visionEmitter: VisionEmitter,
  timelock: TimelockedGovernance,
  signer: Signer
): Promise<void> {
  await visionEmitter.connect(signer).setGovernance(timelock.address);
}

export async function getStableReserve(signer: Signer): Promise<StableReserve> {
  const commit = await getCommit(signer);
  const baseCurrency = await getBaseCurrency(signer);
  const timelock = await getTimelockedGovernance(signer);
  const stableReserve = await autoDeploy(
    "StableReserve",
    timelock.address,
    commit.address,
    baseCurrency.address
  );
  return StableReserve__factory.connect(stableReserve.address, signer);
}
export async function setCommitMinter(
  commit: COMMIT,
  stableReserve: StableReserve,
  signer: Signer
): Promise<void> {
  await commit.connect(signer).setMinter(stableReserve.address);
}

export async function getJobBoard(signer: Signer): Promise<JobBoard> {
  const project = await getProject(signer);
  const baseCurrency = await getBaseCurrency(signer);
  const timelock = await getTimelockedGovernance(signer);
  const dividendPool = await getDividendPool(signer);
  const stableReserve = await getStableReserve(signer);
  const jobBoard = await autoDeploy(
    "JobBoard",
    timelock.address,
    project.address,
    dividendPool.address,
    stableReserve.address,
    baseCurrency.address,
    ONE_INCH
  );
  return JobBoard__factory.connect(jobBoard.address, signer);
}

export async function getMarketplace(signer: Signer): Promise<Marketplace> {
  const commit = await getCommit(signer);
  const timelock = await getTimelockedGovernance(signer);
  const dividendPool = await getDividendPool(signer);
  const marketplace = await autoDeploy(
    "Marketplace",
    timelock.address,
    commit.address,
    dividendPool.address
  );
  return Marketplace__factory.connect(marketplace.address, signer);
}

export async function initStableReserve(
  stableReserve: StableReserve,
  jobBoard: JobBoard,
  signer: Signer
): Promise<void> {
  await stableReserve.connect(signer).init(jobBoard.address);
}

export async function scheduleTokenEmissionStart(
  visionEmitter: VisionEmitter,
  timelock: TimelockedGovernance,
  signer: Signer
): Promise<void> {
  const tx = await visionEmitter.populateTransaction.start();
  const timelockTxParams = [
    visionEmitter.address,
    0,
    tx.data,
    constants.HashZero,
    constants.HashZero,
  ];
  // @ts-ignore
  await timelock.connect(signer).schedule(...timelockTxParams, 86400);
}

export async function addTokensToDividendPool(
  timelock: TimelockedGovernance,
  dividendPool: DividendPool,
  baseCurrency: IERC20,
  commit: COMMIT,
  signer: Signer
): Promise<void> {
  const populated0 = await dividendPool.populateTransaction.addToken(
    baseCurrency.address
  );
  const populated1 = await dividendPool.populateTransaction.addToken(
    commit.address
  );
  await timelock.scheduleBatch(
    [dividendPool.address, dividendPool.address],
    [0, 0],
    [populated0.data, populated1.data],
    constants.HashZero, // predecessor
    constants.HashZero, // salt
    86400
  );
}

export async function transferGovernance(
  timelock: TimelockedGovernance,
  workersUnion: WorkersUnion,
  signer: Signer
): Promise<void> {
  const isDevEnv = !["mainnet", "rinkeby"].includes(
    ethers.provider.network.name
  );
  const MULTISIG_WALLET = process.env.MULTISIG_WALLET;
  let multisig: string;
  const deployer = await signer.getAddress();
  if (isDevEnv) {
    multisig = deployer;
  } else {
    if (!isAddress(MULTISIG_WALLET)) {
      throw Error("You should setup multi sig wallet");
    }
    multisig = MULTISIG_WALLET;
  }
  await timelock.grantRole(getRoleHash("PROPOSER_ROLE"), multisig);
  await timelock.grantRole(getRoleHash("EXECUTOR_ROLE"), multisig);
  await timelock.grantRole(getRoleHash("PROPOSER_ROLE"), workersUnion.address);
  await timelock.grantRole(getRoleHash("EXECUTOR_ROLE"), workersUnion.address);
  await timelock.grantRole(
    getRoleHash("TIMELOCK_ADMIN_ROLE"),
    workersUnion.address
  );
  const populated = await timelock.populateTransaction.revokeRole(
    getRoleHash("EXECUTOR_ROLE"),
    multisig
  );
  const delay = 3600 * 24 * 7 * 4; // about 4 weeks
  const target = populated.to;
  if (!target) throw Error("populated tx does not have the to value");
  await timelock.forceSchedule(
    target,
    populated.value || 0,
    populated.data,
    constants.HashZero, // predecessor
    constants.HashZero, // salt
    delay
  );
  if (!isDevEnv) {
    await timelock.revokeRole(getRoleHash("PROPOSER_ROLE"), deployer);
    await timelock.revokeRole(getRoleHash("EXECUTOR_ROLE"), deployer);
    await timelock.revokeRole(getRoleHash("TIMELOCK_ADMIN_ROLE"), deployer);
  }
}
