import deployedContract from "./deployed.json";

export type MyNetwork = "mainnet" | "rinkeby" | "hardhat" | "localhost";

export type DeployableContracts =
  | "VISION"
  | "COMMIT"
  | "RIGHT"
  | "VotingEscrowLock"
  | "WorkersUnion"
  | "SquareRootVoteCounter"
  | "ERC20BurnMiningV1Factory"
  | "ERC20StakeMiningV1Factory"
  | "ERC721StakeMiningV1Factory"
  | "ERC1155StakeMiningV1Factory"
  | "VisionEmitter"
  | "DividendPool"
  | "BurnMining"
  | "StakeMining"
  | "CommitMining"
  | "LiquidityMining"
  | "StableReserve"
  | "Marketplace"
  | "JobBoard"
  | "Project"
  | "TeamShare"
  | "TeamSharePool"
  | "TimelockedGovernance";

export type MyContracts =
  | "VisionLP"
  | "BaseCurrency"
  | "CommitMining"
  | "LiquidityMining";

export type ContractNames = DeployableContracts | MyContracts;

export type Deployed = {
  [network in MyNetwork]?: {
    [contract in ContractNames]?: string;
  };
} &
  {
    [network in MyNetwork]?: {
      sequence?: {
        [key: number]: boolean;
      };
    };
  };

export const getNetworkName = (chainId: number): MyNetwork => {
  if (chainId === 1) return "mainnet";
  if (chainId === 4) return "rinkeby";
  else if (chainId === 31337) return "localhost";
  else throw Error("Unknown network");
};

export const deployed: Deployed = deployedContract;
