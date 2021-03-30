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
