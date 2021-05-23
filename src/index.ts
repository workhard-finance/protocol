import { BigNumberish } from "@ethersproject/bignumber";
import { constants, ethers, Signer } from "ethers";
import deployedContract from "../deployed.json";
import {
  COMMIT,
  COMMIT__factory,
  DividendPool,
  DividendPool__factory,
  ERC1155StakeMiningV1Factory,
  ERC1155StakeMiningV1Factory__factory,
  ERC20BurnMiningV1,
  ERC20BurnMiningV1Factory,
  ERC20BurnMiningV1Factory__factory,
  ERC20BurnMiningV1__factory,
  ERC20StakeMiningV1,
  ERC20StakeMiningV1Factory,
  ERC20StakeMiningV1Factory__factory,
  ERC20StakeMiningV1__factory,
  ERC721StakeMiningV1Factory,
  ERC721StakeMiningV1Factory__factory,
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
  WETH9,
  WETH9__factory,
  WorkersUnion,
  WorkersUnion__factory,
  Workhard,
  Workhard__factory,
} from "../build/contracts";

import {
  IUniswapV2Factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair,
  IUniswapV2Pair__factory,
} from "../build/@uniswap";

export {
  IUniswapV2Factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair,
  IUniswapV2Pair__factory,
} from "../build/@uniswap";

export * from "../build/contracts";

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

export type WorkhardCommons = {
  pool2Factory: IUniswapV2Factory;
  weth: WETH9;
  erc20StakeMiningV1Factory: ERC20StakeMiningV1Factory;
  erc20BurnMiningV1Factory: ERC20BurnMiningV1Factory;
  erc721StakeMiningV1Factory: ERC721StakeMiningV1Factory;
  erc1155StakeMiningV1Factory: ERC1155StakeMiningV1Factory;
};

export type WorkhardPeriphery = {
  visionLP: IUniswapV2Pair;
  commitMining: ERC20BurnMiningV1;
  liquidityMining: ERC20StakeMiningV1;
};

export class WorkhardClient {
  workhard: Workhard;
  commons: WorkhardCommons;
  signer?: ethers.Signer;

  constructor(
    _workhard: Workhard,
    _commons: WorkhardCommons,
    signer?: ethers.Signer
  ) {
    this.workhard = _workhard;
    this.commons = _commons;
    if (signer) {
      this.setSigner(signer);
    }
  }

  static async from(
    library: ethers.providers.Provider,
    deployed: string | Deployed,
    option?: {
      account?: Signer;
    }
  ): Promise<WorkhardClient> {
    const chainId = (await library.getNetwork()).chainId;
    const networkName = getNetworkName(chainId);
    const address =
      typeof deployed === "string" ? deployed : deployed[networkName].Workhard;
    const workhard = Workhard__factory.connect(
      address,
      option?.account || library
    );
    const commonContracts = await workhard.getCommons();
    const commons = {
      pool2Factory: IUniswapV2Factory__factory.connect(
        commonContracts.pool2Factory,
        workhard.provider
      ),
      weth: WETH9__factory.connect(commonContracts.weth, workhard.provider),
      erc20StakeMiningV1Factory: ERC20StakeMiningV1Factory__factory.connect(
        commonContracts.erc20StakeMiningV1Factory,
        workhard.provider
      ),
      erc20BurnMiningV1Factory: ERC20BurnMiningV1Factory__factory.connect(
        commonContracts.erc20BurnMiningV1Factory,
        workhard.provider
      ),
      erc721StakeMiningV1Factory: ERC721StakeMiningV1Factory__factory.connect(
        commonContracts.erc721StakeMiningV1Factory,
        workhard.provider
      ),
      erc1155StakeMiningV1Factory: ERC1155StakeMiningV1Factory__factory.connect(
        commonContracts.erc1155StakeMiningV1Factory,
        workhard.provider
      ),
    };
    return new WorkhardClient(workhard, commons, option?.account);
  }

  connect = (
    signerOrProvider: string | ethers.providers.Provider | ethers.Signer
  ): WorkhardClient => {
    return this._connect(signerOrProvider);
  };

  setSigner = (signer: ethers.Signer): WorkhardClient => {
    this.signer = signer;
    return this._connect(signer);
  };

  private _connect = (
    signerOrProvider: string | ethers.providers.Provider | ethers.Signer
  ): WorkhardClient => {
    this.workhard = this.workhard.connect(signerOrProvider);
    this.commons.pool2Factory =
      this.commons.pool2Factory.connect(signerOrProvider);
    this.commons.weth = this.commons.weth.connect(signerOrProvider);
    this.commons.erc20BurnMiningV1Factory =
      this.commons.erc20BurnMiningV1Factory.connect(signerOrProvider);
    this.commons.erc20StakeMiningV1Factory =
      this.commons.erc20StakeMiningV1Factory.connect(signerOrProvider);
    this.commons.erc721StakeMiningV1Factory =
      this.commons.erc721StakeMiningV1Factory.connect(signerOrProvider);
    this.commons.erc1155StakeMiningV1Factory =
      this.commons.erc1155StakeMiningV1Factory.connect(signerOrProvider);
    return this;
  };

  getMasterDAO = async (option?: {
    account?: Signer;
  }): Promise<WorkhardDAO> => {
    const dao = await this.getDAO(0, option);
    return dao;
  };

  getDAO = async (
    id: BigNumberish,
    option?: {
      account?: Signer;
    }
  ): Promise<WorkhardDAO | undefined> => {
    const contracts = await this.workhard.getDAO(id);
    if (contracts.timelock === constants.AddressZero) return undefined;
    const connector = option?.account || this.signer || this.workhard.provider;
    let multisig = GnosisSafe__factory.connect(contracts.multisig, connector);
    let baseCurrency = IERC20__factory.connect(
      contracts.baseCurrency,
      connector
    );
    let timelock = TimelockedGovernance__factory.connect(
      contracts.timelock,
      connector
    );
    let vision = VISION__factory.connect(contracts.vision, connector);
    let commit = COMMIT__factory.connect(contracts.commit, connector);
    let right = RIGHT__factory.connect(contracts.right, connector);
    let founderShare = FounderShare__factory.connect(
      contracts.founderShare,
      connector
    );
    let stableReserve = StableReserve__factory.connect(
      contracts.stableReserve,
      connector
    );
    let jobBoard = JobBoard__factory.connect(contracts.jobBoard, connector);
    let marketplace = Marketplace__factory.connect(
      contracts.marketplace,
      connector
    );
    let dividendPool = DividendPool__factory.connect(
      contracts.dividendPool,
      connector
    );
    let voteCounter = VoteCounter__factory.connect(
      contracts.voteCounter,
      connector
    );
    let workersUnion = WorkersUnion__factory.connect(
      contracts.workersUnion,
      connector
    );
    let visionEmitter = VisionEmitter__factory.connect(
      contracts.visionEmitter,
      connector
    );
    let votingEscrow = VotingEscrowLock__factory.connect(
      contracts.votingEscrow,
      connector
    );

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

  getPeriphery = async (
    id: BigNumberish,
    option?: {
      account?: Signer;
    }
  ): Promise<WorkhardPeriphery | undefined> => {
    const connector = option?.account || this.signer || this.workhard.provider;
    const dao = await this.getDAO(id, option);
    const visionLPAddress = await this.commons.pool2Factory.getPair(
      dao.vision.address,
      this.commons.weth.address
    );
    const commitMiningPoolAddr =
      await this.commons.erc20BurnMiningV1Factory.poolAddress(
        dao.visionEmitter.address,
        dao.commit.address
      );
    const liquidityMiningPoolAddr =
      await this.commons.erc20StakeMiningV1Factory.poolAddress(
        dao.visionEmitter.address,
        visionLPAddress
      );
    return {
      visionLP: IUniswapV2Pair__factory.connect(visionLPAddress, connector),
      liquidityMining: ERC20StakeMiningV1__factory.connect(
        liquidityMiningPoolAddr,
        connector
      ),
      commitMining: ERC20BurnMiningV1__factory.connect(
        commitMiningPoolAddr,
        connector
      ),
    };
  };
}
