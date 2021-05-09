import deployedContract from "./deployed.json";

export type MyNetwork = "mainnet" | "rinkeby" | "hardhat" | "localhost";

export type DeployableContracts =
  | "VISION"
  | "COMMIT"
  | "RIGHT"
  | "WorkersUnion"
  | "SquareRootVoteCounter"
  | "BurnMiningPoolFactory"
  | "StakeMiningPoolFactory"
  | "VisionEmitter"
  | "DividendPool"
  | "BurnMining"
  | "StakeMining"
  | "CommitmentMining"
  | "LiquidityMining"
  | "StableReserve"
  | "Marketplace"
  | "ProductFactory"
  | "JobBoard"
  | "Project"
  | "TeamShare"
  | "TimelockedGovernance";

export type MyContracts =
  | "VisionLP"
  | "BaseCurrency"
  | "CommitmentMining"
  | "LiquidityMining";

export type ContractNames = DeployableContracts | MyContracts;

export type Deployed = {
  [network in MyNetwork]?: {
    [contract in ContractNames]?: string;
  };
};

export const getNetworkName = (chainId: number): MyNetwork => {
  if (chainId === 1) return "mainnet";
  if (chainId === 4) return "rinkeby";
  else if (chainId === 31337) return "localhost";
  else throw Error("Unknown network");
};

export const deployed: Deployed = deployedContract;
