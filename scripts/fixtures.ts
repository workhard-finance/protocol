// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { WETH } from "./utils/deployer";
import {
  COMMIT,
  COMMIT__factory,
  DividendPool,
  DividendPool__factory,
  ERC20,
  ERC20__factory,
  IERC20,
  IERC20__factory,
  ContributionBoard,
  ContributionBoard__factory,
  Marketplace,
  Marketplace__factory,
  RIGHT,
  RIGHT__factory,
  VoteCounter,
  VoteCounter__factory,
  StableReserve,
  StableReserve__factory,
  ERC20BurnMiningV1,
  ERC20BurnMiningV1__factory,
  ERC20BurnMiningV1Factory,
  ERC20BurnMiningV1Factory__factory,
  ERC20StakeMiningV1,
  ERC20StakeMiningV1__factory,
  ERC20StakeMiningV1Factory,
  ERC20StakeMiningV1Factory__factory,
  ERC721StakeMiningV1,
  ERC721StakeMiningV1__factory,
  ERC721StakeMiningV1Factory,
  ERC721StakeMiningV1Factory__factory,
  ERC1155StakeMiningV1,
  ERC1155StakeMiningV1__factory,
  ERC1155StakeMiningV1Factory,
  ERC1155StakeMiningV1Factory__factory,
  TimelockedGovernance,
  TimelockedGovernance__factory,
  VISION,
  VisionEmitter,
  VisionEmitter__factory,
  VISION__factory,
  VotingEscrowLock,
  VotingEscrowLock__factory,
  WorkersUnion,
  WorkersUnion__factory,
  Project__factory,
  Project,
  Workhard,
  InitialContributorShareFactory,
  ERC1155BurnMiningV1Factory,
  InitialContributorShareFactory__factory,
  ERC1155BurnMiningV1Factory__factory,
  JobBoard,
  JobBoard__factory,
} from "../src";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants, Contract } from "ethers";

export interface HelperFixture {
  baseCurrency: ERC20;
  multisig: SignerWithAddress;
}

export interface CommonsFixture extends HelperFixture {
  pool2Factory: Contract;
  weth: Contract;
  sablier: Contract;
  erc20BurnMiningV1Factory: ERC20BurnMiningV1Factory;
  erc20StakeMiningV1Factory: ERC20StakeMiningV1Factory;
  erc721StakeMiningV1Factory: ERC721StakeMiningV1Factory;
  erc1155StakeMiningV1Factory: ERC1155StakeMiningV1Factory;
  erc1155BurnMiningV1Factory: ERC1155BurnMiningV1Factory;
  initialContributorShareFactory: InitialContributorShareFactory;
}

export interface DAOFixture extends CommonsFixture {
  vision: VISION;
  commit: COMMIT;
  right: RIGHT;
  votingEscrow: VotingEscrowLock;
  timelock: TimelockedGovernance;
  dividendPool: DividendPool;
  stableReserve: StableReserve;
  contributionBoard: ContributionBoard;
  marketplace: Marketplace;
  voteCounter: VoteCounter;
  workersUnion: WorkersUnion;
  visionEmitter: VisionEmitter;
  workhard: Project;
}

const forked = process.env.FORK ? process.env.FORK.length > 0 : false;

export async function getHelperFixture(): Promise<HelperFixture> {
  const [deployer] = await ethers.getSigners();
  // 1. Get base currency. (In mainnet use DAI & for testing deploy new)
  const mock = await (
    await ethers.getContractFactory("contracts/utils/ERC20Mock.sol:ERC20")
  ).deploy();
  const baseCurrency = ERC20__factory.connect(mock.address, deployer);
  return {
    baseCurrency,
    multisig: deployer,
  };
}

export async function getCommonFixture(): Promise<CommonsFixture> {
  const [deployer] = await ethers.getSigners();
  const helperFixture: HelperFixture = await getHelperFixture();

  const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
  const pool2Factory = await ethers.getContractAt(
    "UniswapV2Factory",
    forked
      ? "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"
      : (
          await UniswapV2Factory.deploy(deployer.address)
        ).address,
    deployer
  );

  const WETH9Factory = await ethers.getContractFactory("WETH9");
  const weth = await ethers.getContractAt(
    "WETH9",
    forked
      ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      : (
          await WETH9Factory.deploy()
        ).address,
    deployer
  );

  const SablierFactory = await ethers.getContractFactory("Sablier");
  const sablier = await ethers.getContractAt(
    "Sablier",
    forked
      ? "0xA4fc358455Febe425536fd1878bE67FfDBDEC59a"
      : (
          await SablierFactory.deploy(deployer.address)
        ).address,
    deployer
  );

  // 14. Deploy ERC20BurnMiningV1Factory
  const erc20BurnMiningV1Factory = ERC20BurnMiningV1Factory__factory.connect(
    (
      await (
        await ethers.getContractFactory("ERC20BurnMiningV1Factory")
      ).deploy()
    ).address,
    deployer
  );
  // 15. Deploy ERC20StakeMiningV1Factory
  const erc20StakeMiningV1Factory = ERC20StakeMiningV1Factory__factory.connect(
    (
      await (
        await ethers.getContractFactory("ERC20StakeMiningV1Factory")
      ).deploy()
    ).address,
    deployer
  );
  // 16. Deploy ERC721StakeMiningV1Factory
  const erc721StakeMiningV1Factory =
    ERC721StakeMiningV1Factory__factory.connect(
      (
        await (
          await ethers.getContractFactory("ERC721StakeMiningV1Factory")
        ).deploy()
      ).address,
      deployer
    );
  // 17. Deploy ERC1155StakeMiningV1Factory
  const erc1155StakeMiningV1Factory =
    ERC1155StakeMiningV1Factory__factory.connect(
      (
        await (
          await ethers.getContractFactory("ERC1155StakeMiningV1Factory")
        ).deploy()
      ).address,
      deployer
    );
  // 18. Deploy ERC1155StakeMiningV1Factory
  const erc1155BurnMiningV1Factory =
    ERC1155BurnMiningV1Factory__factory.connect(
      (
        await (
          await ethers.getContractFactory("ERC1155BurnMiningV1Factory")
        ).deploy()
      ).address,
      deployer
    );
  // 19. Deploy ERC1155StakeMiningV1Factory
  const initialContributorShareFactory =
    InitialContributorShareFactory__factory.connect(
      (
        await (
          await ethers.getContractFactory("InitialContributorShareFactory")
        ).deploy()
      ).address,
      deployer
    );
  return {
    ...helperFixture,
    pool2Factory,
    weth,
    sablier,
    erc20BurnMiningV1Factory,
    erc20StakeMiningV1Factory,
    erc721StakeMiningV1Factory,
    erc1155StakeMiningV1Factory,
    erc1155BurnMiningV1Factory,
    initialContributorShareFactory,
  };
}

export async function getWorkhard(): Promise<Workhard> {
  const commonsFixture = await getCommonFixture();
  const [deployer] = await ethers.getSigners();

  const vision = VISION__factory.connect(
    (await (await ethers.getContractFactory("VISION")).deploy()).address,
    deployer
  );

  const commit = COMMIT__factory.connect(
    (await (await ethers.getContractFactory("COMMIT")).deploy()).address,
    deployer
  );
  const right = RIGHT__factory.connect(
    (await (await ethers.getContractFactory("RIGHT")).deploy()).address,
    deployer
  );
  const votingEscrow = VotingEscrowLock__factory.connect(
    (await (await ethers.getContractFactory("VotingEscrowLock")).deploy())
      .address,
    deployer
  );
  const timelock = TimelockedGovernance__factory.connect(
    (await (await ethers.getContractFactory("TimelockedGovernance")).deploy())
      .address,
    deployer
  );
  const dividendPool = DividendPool__factory.connect(
    (await (await ethers.getContractFactory("DividendPool")).deploy()).address,
    deployer
  );
  const stableReserve = StableReserve__factory.connect(
    (await (await ethers.getContractFactory("StableReserve")).deploy()).address,
    deployer
  );
  const contributionBoard = ContributionBoard__factory.connect(
    (await (await ethers.getContractFactory("ContributionBoard")).deploy())
      .address,
    deployer
  );
  const marketplace = Marketplace__factory.connect(
    (await (await ethers.getContractFactory("Marketplace")).deploy()).address,
    deployer
  );
  const voteCounter = VoteCounter__factory.connect(
    (await (await ethers.getContractFactory("VoteCounter")).deploy()).address,
    deployer
  );
  const workersUnion = WorkersUnion__factory.connect(
    (await (await ethers.getContractFactory("WorkersUnion")).deploy()).address,
    deployer
  );
  const visionEmitter = VisionEmitter__factory.connect(
    (await (await ethers.getContractFactory("VisionEmitter")).deploy()).address,
    deployer
  );
  const workhard = Project__factory.connect(
    (
      await (
        await ethers.getContractFactory("Project")
      ).deploy(
        {
          multisig: commonsFixture.multisig.address,
          baseCurrency: commonsFixture.baseCurrency.address,
          timelock: timelock.address,
          vision: vision.address,
          commit: commit.address,
          right: right.address,
          stableReserve: stableReserve.address,
          contributionBoard: contributionBoard.address,
          marketplace: marketplace.address,
          dividendPool: dividendPool.address,
          voteCounter: voteCounter.address,
          workersUnion: workersUnion.address,
          visionEmitter: visionEmitter.address,
          votingEscrow: votingEscrow.address,
        },
        {
          pool2Factory: commonsFixture.pool2Factory.address,
          weth: commonsFixture.weth.address,
          sablier: commonsFixture.sablier.address,
          erc20StakeMiningV1Factory:
            commonsFixture.erc20StakeMiningV1Factory.address,
          erc20BurnMiningV1Factory:
            commonsFixture.erc20BurnMiningV1Factory.address,
          erc721StakeMiningV1Factory:
            commonsFixture.erc721StakeMiningV1Factory.address,
          erc1155StakeMiningV1Factory:
            commonsFixture.erc1155StakeMiningV1Factory.address,
          erc1155BurnMiningV1Factory:
            commonsFixture.erc1155BurnMiningV1Factory.address,
          initialContributorShareFactory:
            commonsFixture.initialContributorShareFactory.address,
        }
      )
    ).address,
    deployer
  );
  await workhard.upgradeToDAO(0, {
    multisig: commonsFixture.multisig.address,
    baseCurrency: commonsFixture.baseCurrency.address,
    projectName: "Workhard Master Dev",
    projectSymbol: "WMD",
    visionName: "The Master Vision",
    visionSymbol: "VISION",
    commitName: "Work Hard Commit",
    commitSymbol: "COMMIT",
    rightName: "Work Hard Right",
    rightSymbol: "RIGHT",
    emissionStartDelay: 86400 * 7,
    minDelay: 86400,
    voteLaunchDelay: 2419200,
    initialEmission: ethers.utils.parseEther("24000000"),
    minEmissionRatePerWeek: 60,
    emissionCutRate: 1000,
    founderShare: 500,
  });
  const masterDAO = await workhard.getMasterDAO();
  await ContributionBoard__factory.connect(
    masterDAO.contributionBoard,
    deployer
  ).recordContribution(deployer.address, 0, ethers.utils.parseEther("1000000"));
  await workhard.launch(0, 4750, 4750, 499, 1);

  const client = await Workhard.from(ethers.provider, workhard.address);
  return client;
}
