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
  | "LaborMarket"
  | "ProductMarket"
  | "ProductFactory"
  | "DealManager"
  | "TeamShare"
  | "TimelockedGovernance";

export type MyContracts =
  | "VisionLP"
  | "StableCoin"
  | "CommitmentMining"
  | "LiquidityMining";

export type ContractNames = DeployableContracts | MyContracts;
