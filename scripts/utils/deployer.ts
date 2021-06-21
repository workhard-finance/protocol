import hre, { ethers } from "hardhat";
import { Contract, constants, ContractTransaction } from "ethers";

import { autoDeploy, getDB, getRoleHash, record } from "./helper";
import {
  ERC1155BurnMiningV1Factory,
  ERC1155BurnMiningV1Factory__factory,
  MyNetwork,
} from "../../src";

import {
  ERC20BurnMiningV1,
  ERC20StakeMiningV1,
  ERC20BurnMiningV1__factory,
  ERC20StakeMiningV1__factory,
  ERC20BurnMiningV1Factory,
  ERC20StakeMiningV1Factory,
  ERC721StakeMiningV1Factory,
  ERC1155StakeMiningV1Factory,
  ERC20BurnMiningV1Factory__factory,
  ERC20StakeMiningV1Factory__factory,
  ERC721StakeMiningV1Factory__factory,
  ERC1155StakeMiningV1Factory__factory,
  InitialContributorShare__factory,
  InitialContributorShareFactory,
  InitialContributorShareFactory__factory,
  COMMIT,
  COMMIT__factory,
  DividendPool,
  DividendPool__factory,
  ERC20__factory,
  IERC20,
  IERC20__factory,
  IERC1620,
  IERC1620__factory,
  ContributionBoard,
  ContributionBoard__factory,
  Marketplace,
  Marketplace__factory,
  StableReserve,
  StableReserve__factory,
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
  RIGHT__factory,
  GnosisSafe,
  GnosisSafe__factory,
  Project,
  Project__factory,
} from "../../src";
import { isAddress, parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
export const SUSHISWAP_FACTORY = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";

export const isForkedNet = async () => {
  try {
    const daiSymbol = await ERC20__factory.connect(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      ethers.provider
    ).symbol();
    return daiSymbol === "DAI";
  } catch {
    return false;
  }
};

/** Deploy Workhard Common Contracts first*/
export async function getPool2Factory(
  signer: SignerWithAddress
): Promise<Contract> {
  const network = hre.network.name as MyNetwork;
  const deployed = await getDB();
  const deployedAddress = await deployed.get(`${network}.Pool2Factory`).value();
  let pool2Factory: Contract;
  if (deployedAddress) {
    pool2Factory = await ethers.getContractAt(
      "IUniswapV2Factory",
      deployedAddress
    );
  } else {
    if (["mainnet"].includes(network) || (await isForkedNet())) {
      pool2Factory = await ethers.getContractAt(
        "IUniswapV2Factory",
        SUSHISWAP_FACTORY // yay!
      );
    } else if (["rinkeby"].includes(network)) {
      pool2Factory = await ethers.getContractAt(
        "IUniswapV2Factory",
        UNISWAP_FACTORY
      );
    } else {
      const UniswapV2Factory = await ethers.getContractFactory(
        "UniswapV2Factory"
      );
      pool2Factory = await UniswapV2Factory.deploy(await signer.getAddress());
    }
  }
  record(hre.network.name as MyNetwork, "Pool2Factory", pool2Factory.address);
  return pool2Factory;
}

export async function getWETH(signer: SignerWithAddress): Promise<IERC20> {
  const network = hre.network.name as MyNetwork;
  let wethAddress: string;
  const deployed = await getDB();
  const deployedAddress = await deployed.get(`${network}.WETH`).value();
  if (deployedAddress) {
    wethAddress = deployedAddress;
  } else {
    if (["mainnet"].includes(network) || (await isForkedNet())) {
      wethAddress = WETH;
    } else if (["rinkeby"].includes(network)) {
      wethAddress = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
    } else {
      const WETHFactory = await ethers.getContractFactory("WETH9", signer);
      const weth = await WETHFactory.deploy();
      wethAddress = weth.address;
    }
  }
  record(hre.network.name as MyNetwork, "WETH", wethAddress);
  return IERC20__factory.connect(wethAddress, signer);
}

export async function getERC20BurnMiningV1Factory(
  signer: SignerWithAddress
): Promise<ERC20BurnMiningV1Factory> {
  const erc20BurnMiningV1Factory = await autoDeploy("ERC20BurnMiningV1Factory");
  return ERC20BurnMiningV1Factory__factory.connect(
    erc20BurnMiningV1Factory.address,
    signer
  );
}

export async function getERC20StakeMiningV1Factory(
  signer: SignerWithAddress
): Promise<ERC20StakeMiningV1Factory> {
  const erc20StakeMiningV1Factory = await autoDeploy(
    "ERC20StakeMiningV1Factory"
  );
  return ERC20StakeMiningV1Factory__factory.connect(
    erc20StakeMiningV1Factory.address,
    signer
  );
}

export async function getERC721StakeMiningV1Factory(
  signer: SignerWithAddress
): Promise<ERC721StakeMiningV1Factory> {
  const erc721StakeMiningV1Factory = await autoDeploy(
    "ERC721StakeMiningV1Factory"
  );
  return ERC721StakeMiningV1Factory__factory.connect(
    erc721StakeMiningV1Factory.address,
    signer
  );
}

export async function getERC1155StakeMiningV1Factory(
  signer: SignerWithAddress
): Promise<ERC1155StakeMiningV1Factory> {
  const erc1155StakeMiningV1Factory = await autoDeploy(
    "ERC1155StakeMiningV1Factory"
  );
  return ERC1155StakeMiningV1Factory__factory.connect(
    erc1155StakeMiningV1Factory.address,
    signer
  );
}

export async function getERC1155BurnMiningV1Factory(
  signer: SignerWithAddress
): Promise<ERC1155BurnMiningV1Factory> {
  const erc1155BurnMiningV1Factory = await autoDeploy(
    "ERC1155BurnMiningV1Factory"
  );
  return ERC1155BurnMiningV1Factory__factory.connect(
    erc1155BurnMiningV1Factory.address,
    signer
  );
}

export async function getInitialContributorShareFactory(
  signer: SignerWithAddress
): Promise<InitialContributorShareFactory> {
  const initialContributorShare = await autoDeploy(
    "InitialContributorShareFactory"
  );
  return InitialContributorShareFactory__factory.connect(
    initialContributorShare.address,
    signer
  );
}

/** Deploy Workhard Master DAO */

export async function getMultisig(
  signer: SignerWithAddress
): Promise<SignerWithAddress | GnosisSafe> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  let walletAddress: string;
  if (["mainnet"].includes(network) || (await isForkedNet())) {
    walletAddress = "0x9762976Dd3E0279Ea0a5B931Dc5B1403Bd17475E";
  } else if (network === "rinkeby") {
    walletAddress = "0xe22c5c2c89c3fD27603aefD9386D7Fb68f857e65";
  } else {
    return signer;
  }
  const safe = GnosisSafe__factory.connect(walletAddress, signer);
  return safe;
}

export async function getBaseCurrency(
  signer: SignerWithAddress
): Promise<IERC20> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = await getDB();
  const deployedAddress = await deployed.get(`${network}.BaseCurrency`).value();
  let stablecoin: string;
  if (deployedAddress) {
    stablecoin = deployedAddress;
  } else if (["mainnet"].includes(network) || (await isForkedNet())) {
    // mainnet DAI
    stablecoin = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  } else if (network === "rinkeby") {
    // rinkeby DAI
    stablecoin = "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735";
  } else {
    // deploy!
    const mockERC20 = await new ERC20__factory(signer).deploy();
    stablecoin = mockERC20.address;
  }
  record(hre.network.name as MyNetwork, "BaseCurrency", stablecoin);
  return IERC20__factory.connect(stablecoin, signer);
}

export async function getSablier(signer: SignerWithAddress): Promise<IERC1620> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = await getDB();
  const deployedAddress = await deployed.get(`${network}.Sablier`).value();
  let sablier: string;
  if (deployedAddress) {
    sablier = deployedAddress;
  } else if (["mainnet"].includes(network) || (await isForkedNet())) {
    // mainnet sablier
    sablier = "0xA4fc358455Febe425536fd1878bE67FfDBDEC59a";
  } else if (network === "rinkeby") {
    // rinkeby sablier
    sablier = "0xc04Ad234E01327b24a831e3718DBFcbE245904CC";
  } else {
    // deploy!
    const SablierFactory = await ethers.getContractFactory("Sablier", signer);
    const sablierInstance = await SablierFactory.deploy(signer.address); // we'll not use cToken manager
    sablier = sablierInstance.address;
  }
  record(hre.network.name as MyNetwork, "Sablier", sablier);
  return IERC1620__factory.connect(sablier, signer);
}

export async function getTimelockedGovernance(
  signer: SignerWithAddress
): Promise<TimelockedGovernance> {
  const tg = await autoDeploy("TimelockedGovernance");
  return TimelockedGovernance__factory.connect(tg.address, signer);
}

export async function getVision(signer: SignerWithAddress): Promise<VISION> {
  const vision = await autoDeploy("VISION");
  return VISION__factory.connect(vision.address, signer);
}

export async function getCommit(signer: SignerWithAddress): Promise<COMMIT> {
  const commit = await autoDeploy("COMMIT");
  return COMMIT__factory.connect(commit.address, signer);
}

export async function getRight(
  signer: SignerWithAddress
): Promise<VotingEscrowToken> {
  const right = await autoDeploy("RIGHT");
  return RIGHT__factory.connect(right.address, signer);
}

export async function getStableReserve(
  signer: SignerWithAddress
): Promise<StableReserve> {
  const stableReserve = await autoDeploy("StableReserve");
  return StableReserve__factory.connect(stableReserve.address, signer);
}

export async function getContributionBoard(
  signer: SignerWithAddress
): Promise<ContributionBoard> {
  const contributionBoard = await autoDeploy("ContributionBoard");
  return ContributionBoard__factory.connect(contributionBoard.address, signer);
}

export async function getMarketplace(
  signer: SignerWithAddress
): Promise<Marketplace> {
  const marketplace = await autoDeploy("Marketplace");
  return Marketplace__factory.connect(marketplace.address, signer);
}

export async function getDividendPool(
  signer: SignerWithAddress
): Promise<DividendPool> {
  const dividendPool = await autoDeploy("DividendPool");
  return DividendPool__factory.connect(dividendPool.address, signer);
}

export async function getVoteCounter(
  signer: SignerWithAddress
): Promise<VoteCounter> {
  const voteCounter = await autoDeploy("VoteCounter");
  return VoteCounter__factory.connect(voteCounter.address, signer);
}

export async function getWorkersUnion(
  signer: SignerWithAddress
): Promise<WorkersUnion> {
  const workersUnion = await autoDeploy("WorkersUnion");
  return WorkersUnion__factory.connect(workersUnion.address, signer);
}

export async function getVisionEmitter(
  signer: SignerWithAddress
): Promise<VisionEmitter> {
  const visionEmitter = await autoDeploy("VisionEmitter");
  return VisionEmitter__factory.connect(visionEmitter.address, signer);
}

export async function getVotingEscrow(
  signer: SignerWithAddress
): Promise<VotingEscrowLock> {
  const votingEscrow = await autoDeploy("VotingEscrowLock");
  return VotingEscrowLock__factory.connect(votingEscrow.address, signer);
}

/** Deploy WORKHARD DAO */

export async function getProject(signer: SignerWithAddress): Promise<Project> {
  const controller = {
    multisig: (await getMultisig(signer)).address,
    baseCurrency: (await getBaseCurrency(signer)).address,
    timelock: (await getTimelockedGovernance(signer)).address,
    vision: (await getVision(signer)).address,
    commit: (await getCommit(signer)).address,
    right: (await getRight(signer)).address,
    stableReserve: (await getStableReserve(signer)).address,
    contributionBoard: (await getContributionBoard(signer)).address,
    marketplace: (await getMarketplace(signer)).address,
    dividendPool: (await getDividendPool(signer)).address,
    voteCounter: (await getVoteCounter(signer)).address,
    workersUnion: (await getWorkersUnion(signer)).address,
    visionEmitter: (await getVisionEmitter(signer)).address,
    votingEscrow: (await getVotingEscrow(signer)).address,
  };
  const commons = {
    pool2Factory: (await getPool2Factory(signer)).address,
    weth: (await getWETH(signer)).address,
    sablier: (await getSablier(signer)).address,
    erc20StakeMiningV1Factory: (await getERC20StakeMiningV1Factory(signer))
      .address,
    erc20BurnMiningV1Factory: (await getERC20BurnMiningV1Factory(signer))
      .address,
    erc721StakeMiningV1Factory: (await getERC721StakeMiningV1Factory(signer))
      .address,
    erc1155StakeMiningV1Factory: (await getERC1155StakeMiningV1Factory(signer))
      .address,
    erc1155BurnMiningV1Factory: (await getERC1155BurnMiningV1Factory(signer))
      .address,
    initialContributorShareFactory: (
      await getInitialContributorShareFactory(signer)
    ).address,
  };
  const deployed = await autoDeploy("Project", controller, commons);
  const workhardDAO = Project__factory.connect(deployed.address, signer);
  return workhardDAO;
}

export async function upgradeToMasterDAO(
  project: Project,
  signer: SignerWithAddress
): Promise<void> {
  const network = hre.network.name as MyNetwork;
  const isMainnet = network === "mainnet";
  let result: ContractTransaction;
  let success: boolean = false;
  do {
    result = await project.upgradeToDAO(0, {
      multisig: (await getMultisig(signer)).address,
      treasury: (await getMultisig(signer)).address,
      baseCurrency: (await getBaseCurrency(signer)).address,
      projectName: "Work Hard Finance",
      projectSymbol: "WHF",
      visionName: "Work Hard Vision",
      visionSymbol: "VISION",
      commitName: "Work Hard Commit",
      commitSymbol: "COMMIT",
      rightName: "Work Hard Right",
      rightSymbol: "RIGHT",
      emissionStartDelay: isMainnet ? 3600 * 24 : 60,
      minDelay: isMainnet ? 86400 : 60,
      voteLaunchDelay: isMainnet ? 86400 * 7 * 4 : 60,
      initialEmission: parseEther("24000000").toString(),
      minEmissionRatePerWeek: 60,
      emissionCutRate: 1000,
      founderShare: 500,
    });
    try {
      const receipt = await result.wait();
      success = true;
    } catch (_err) {
      console.log("Upgrading to DAO tx failed. Try again.");
    }
  } while (!success);
}

export async function launchMasterDAO(
  project: Project,
  signer: SignerWithAddress
): Promise<void> {
  await project.launch(0, 4750, 4750, 499, 1);
  // todo if airdrop pool decided, run launchHard() instead of launch() with detail emission settings
}

export async function forceRemoveSchedule(
  timelock: TimelockedGovernance,
  workersUnion: WorkersUnion,
  signer: SignerWithAddress
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
}
