import { BigNumberish } from "@ethersproject/bignumber";
import { ethers, Signer } from "ethers";
import deployedContract from "./deployed.json";
import {
  COMMIT,
  COMMIT__factory,
  DividendPool,
  DividendPool__factory,
  FounderShare,
  FounderShare__factory,
  GnosisSafe,
  GnosisSafe__factory,
  IERC20,
  IERC20__factory,
  JobBoard,
  JobBoard__factory,
  Marketplace,
  Marketplace__factory,
  RIGHT,
  RIGHT__factory,
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
  WorkersUnion,
  WorkersUnion__factory,
  Workhard__factory,
} from "./build";

export type MyNetwork = "mainnet" | "rinkeby" | "hardhat" | "localhost";

export type WorkhardDAOContractNames =
  | "Multisig"
  | "BaseCurrency"
  | "TimelockedGovernance"
  | "VISION"
  | "COMMIT"
  | "RIGHT"
  | "FounderShare"
  | "StableReserve"
  | "JobBoard"
  | "Marketplace"
  | "DividendPool"
  | "VoteCounter"
  | "WorkersUnion"
  | "VisionEmitter"
  | "VotingEscrowLock";

export type CommonContractNames =
  | "Pool2Factory"
  | "WETH"
  | "ERC20BurnMiningV1Factory"
  | "ERC20StakeMiningV1Factory"
  | "ERC721StakeMiningV1Factory"
  | "ERC1155StakeMiningV1Factory"
  | "Workhard";

export type MiningPoolNames =
  | "ERC20BurnMiningV1"
  | "ERC20StakeMiningV1"
  | "ERC721StakeMiningV1"
  | "ERC1155StakeMiningV1";

export type ContractNames =
  | WorkhardDAOContractNames
  | CommonContractNames
  | MiningPoolNames;

export type Deployed = {
  [network in MyNetwork]?: {
    [contract in CommonContractNames | WorkhardDAOContractNames]?: string;
  };
} &
  {
    [network in MyNetwork]?: {
      sequence?: {
        [key: number]: boolean;
      };
    };
  };

export type WorkhardDAOContracts = {
  [contract in WorkhardDAOContractNames]: string;
};

export const getNetworkName = (chainId: number): MyNetwork => {
  if (chainId === 1) return "mainnet";
  if (chainId === 4) return "rinkeby";
  else if (chainId === 31337) return "localhost";
  else throw Error("Unknown network");
};

export const deployed: Deployed = deployedContract;

export type WorkhardDAO = {
  multisig: GnosisSafe;
  baseCurrency: IERC20;
  timelock: TimelockedGovernance;
  vision: VISION;
  commit: COMMIT;
  right: RIGHT;
  founderShare: FounderShare;
  stableReserve: StableReserve;
  jobBoard: JobBoard;
  marketplace: Marketplace;
  dividendPool: DividendPool;
  voteCounter: VoteCounter;
  workersUnion: WorkersUnion;
  visionEmitter: VisionEmitter;
  votingEscrow: VotingEscrowLock;
};

export const getMasterDAO = async (
  library: ethers.providers.Provider,
  option?: {
    chainId?: number;
    factory?: string;
    account?: Signer;
  }
): Promise<WorkhardDAO | undefined> => {
  const dao = await getDAO(0, library, option);
  return dao;
};

export const getDAO = async (
  id: BigNumberish,
  library: ethers.providers.Provider,
  option?: {
    chainId?: number;
    factory?: string;
    account?: Signer;
  }
): Promise<WorkhardDAO | undefined> => {
  let factoryAddress: string;

  if (option.factory) {
    factoryAddress = option.factory;
  } else {
    const chainId = option.chainId || 1;
    const network = getNetworkName(chainId);
    const factoryAddress = deployed[network].Workhard;
    if (!factoryAddress) {
      return undefined;
    }
  }

  const factory = Workhard__factory.connect(factoryAddress, library);
  const contracts = await factory.getDAO(id);

  let multisig = GnosisSafe__factory.connect(contracts.multisig, library);
  let baseCurrency = IERC20__factory.connect(contracts.baseCurrency, library);
  let timelock = TimelockedGovernance__factory.connect(
    contracts.timelock,
    library
  );
  let vision = VISION__factory.connect(contracts.vision, library);
  let commit = COMMIT__factory.connect(contracts.commit, library);
  let right = RIGHT__factory.connect(contracts.right, library);
  let founderShare = FounderShare__factory.connect(
    contracts.founderShare,
    library
  );
  let stableReserve = StableReserve__factory.connect(
    contracts.stableReserve,
    library
  );
  let jobBoard = JobBoard__factory.connect(contracts.jobBoard, library);
  let marketplace = Marketplace__factory.connect(
    contracts.marketplace,
    library
  );
  let dividendPool = DividendPool__factory.connect(
    contracts.dividendPool,
    library
  );
  let voteCounter = VoteCounter__factory.connect(
    contracts.voteCounter,
    library
  );
  let workersUnion = WorkersUnion__factory.connect(
    contracts.workersUnion,
    library
  );
  let visionEmitter = VisionEmitter__factory.connect(
    contracts.visionEmitter,
    library
  );
  let votingEscrow = VotingEscrowLock__factory.connect(
    contracts.votingEscrow,
    library
  );

  if (option.account) {
    multisig = multisig.connect(option.account);
    baseCurrency = baseCurrency.connect(option.account);
    timelock = timelock.connect(option.account);
    vision = vision.connect(option.account);
    commit = commit.connect(option.account);
    right = right.connect(option.account);
    founderShare = founderShare.connect(option.account);
    stableReserve = stableReserve.connect(option.account);
    jobBoard = jobBoard.connect(option.account);
    marketplace = marketplace.connect(option.account);
    dividendPool = dividendPool.connect(option.account);
    voteCounter = voteCounter.connect(option.account);
    workersUnion = workersUnion.connect(option.account);
    visionEmitter = visionEmitter.connect(option.account);
    votingEscrow = votingEscrow.connect(option.account);
  }
  return {
    multisig,
    baseCurrency,
    timelock,
    vision,
    commit,
    right,
    founderShare,
    stableReserve,
    jobBoard,
    marketplace,
    dividendPool,
    voteCounter,
    workersUnion,
    visionEmitter,
    votingEscrow,
  };
};
