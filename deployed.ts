import deployedContract from "./deployed.json";

export type MyNetwork = "mainnet" | "rinkeby" | "hardhat" | "localhost";

export type DeployableContracts =
  | "VisionToken"
  | "CommitmentToken"
  | "FarmersUnion"
  | "SquareRootVoteCounter"
  | "BurnMiningPoolFactory"
  | "StakeMiningPoolFactory"
  | "VisionTokenEmitter"
  | "VisionFarm"
  | "BurnMining"
  | "StakeMining"
  | "CommitmentMining"
  | "LiquidityMining"
  | "CryptoJobBoard"
  | "Marketplace"
  | "ProductFactory"
  | "ProjectManager"
  | "Project"
  | "TeamShare"
  | "TimelockedGovernance";

export type MyContracts =
  | "VisionLP"
  | "StableCoin"
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
};

export const deployed: Deployed = deployedContract;
