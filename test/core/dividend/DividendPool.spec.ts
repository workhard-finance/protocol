import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { almostEquals, goTo, goToNextWeek } from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DividendPool,
  ERC20,
  ERC20__factory,
  TimelockedGovernance,
  VISION,
  VotingEscrowLock,
  Workhard,
  WorkhardClient,
  WorkhardDAO,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

const day = 86400;
const week = day * 7;
const year = day * 365;
describe("DividendPool.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let distributor: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let client: WorkhardClient;
  let workhard: Workhard;
  let masterDAO: WorkhardDAO;
  let forkedDAO: WorkhardDAO;
  let forkedDAOId: number;
  let vision: VISION;
  let dividendPool: DividendPool;
  let votingEscrow: VotingEscrowLock;
  let timelock: TimelockedGovernance;
  let testingRewardToken: ERC20;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    distributor = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    client = await getWorkhard();
    workhard = client.workhard.connect(deployer);
    masterDAO = await client.getMasterDAO();
    vision = masterDAO.vision;
    dividendPool = masterDAO.dividendPool;
    votingEscrow = masterDAO.votingEscrow;
    timelock = masterDAO.timelock;
    testingRewardToken = await new ERC20__factory(deployer).deploy();
    await testingRewardToken
      .connect(deployer)
      .mint(distributor.address, parseEther("10000"));
    await testingRewardToken
      .connect(distributor)
      .approve(dividendPool.address, parseEther("10000"));
    const mineVision = async () => {
      await goToNextWeek();
      await masterDAO.visionEmitter.connect(deployer).distribute();
    };
    await mineVision();
    const prepare = async (account: SignerWithAddress) => {
      await vision
        .connect(deployer)
        .transfer(account.address, parseEther("100"));
      await vision
        .connect(account)
        .approve(votingEscrow.address, parseEther("100"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
    const fork = async () => {
      await workhard.createProject(0, "mockuri");
      const projId = await workhard.projectsOfDAOByIndex(
        0,
        (await workhard.projectsOf(0)).sub(1)
      );
      await workhard.upgradeToDAO(projId, {
        multisig: deployer.address,
        baseCurrency: masterDAO.baseCurrency.address,
        projectName: "Workhard Forked Dev",
        projectSymbol: "WFK",
        visionName: "Flovoured Vision",
        visionSymbol: "fVISION",
        commitName: "Flavoured Commit",
        commitSymbol: "fCOMMIT",
        rightName: "Flavoured Right",
        rightSymbol: "fRIGHT",
        minDelay: 86400,
        launchDelay: 86400 * 7 * 4,
        initialEmission: parseEther("24000000"),
        minEmissionRatePerWeek: 60,
        emissionCutRate: 3000,
        founderShare: 500,
      });
      await workhard.launch(projId, 4750, 4750, 499, 1);
      return projId;
    };
    const forked = await fork();
    forkedDAOId = forked.toNumber();
    forkedDAO = await client.getDAO(forkedDAOId, { account: deployer });
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("epoch test", async () => {
    describe("getCurrentEpoch()", async () => {
      it("should start from 1 since the test starts after the 1st week", async () => {
        expect(await dividendPool.getCurrentEpoch()).eq(1);
      });
      it("should increment by weekly", async () => {
        let timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        expect(await dividendPool.getCurrentEpoch()).eq(1);
        await goTo(4 * week);
        expect(await dividendPool.getCurrentEpoch()).eq(5);
        await goTo(3 * week);
        expect(await dividendPool.getCurrentEpoch()).eq(8);
      });
    });
  });

  describe("distribution test", () => {
    describe("distributedTokens()", () => {
      it("should return testing reward token after it's distributed", async () => {
        expect(await dividendPool.distributedTokens()).deep.eq([]);
        await dividendPool
          .connect(distributor)
          .distribute(testingRewardToken.address, parseEther("100"));
        expect(await dividendPool.distributedTokens()).deep.eq([
          testingRewardToken.address,
        ]);
        await dividendPool
          .connect(distributor)
          .distribute(testingRewardToken.address, parseEther("100"));
        expect(await dividendPool.distributedTokens()).deep.eq([
          testingRewardToken.address,
        ]);
      });
    });
    describe("totalDistributed()", () => {
      it("should increase the amount when new distribution exists", async () => {
        const total0 = await dividendPool.totalDistributed(
          testingRewardToken.address
        );
        expect(total0).eq(0);
        await dividendPool
          .connect(distributor)
          .distribute(testingRewardToken.address, parseEther("100"));
        const total1 = await dividendPool.totalDistributed(
          testingRewardToken.address
        );
        expect(total1).eq(parseEther("100"));
      });
    });
    describe("claimable()", () => {
      it("distribution should be claimable after 1 epoch", async () => {
        await goTo(1 * week);
        await votingEscrow.connect(alice).createLock(parseEther("10"), 208);
        const claimable0 = await dividendPool
          .connect(alice)
          .claimable(testingRewardToken.address);
        expect(claimable0).eq(0);
        await dividendPool
          .connect(distributor)
          .distribute(testingRewardToken.address, parseEther("100"));
        const claimable1 = await dividendPool
          .connect(alice)
          .claimable(testingRewardToken.address);
        expect(claimable1).eq(0);
        await goToNextWeek();
        const claimable2 = await dividendPool
          .connect(alice)
          .claimable(testingRewardToken.address);
        almostEquals(claimable2, parseEther("100"));
      });
    });
    describe("claim() & claimUpTo()", async () => {
      beforeEach(async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await goTo(1 * week);
        await votingEscrow
          .connect(alice)
          .createLockUntil(parseEther("1"), timestamp + 4 * year);
        await votingEscrow
          .connect(bob)
          .createLockUntil(parseEther("0.1"), timestamp + 4 * year);
        await votingEscrow
          .connect(carl)
          .createLockUntil(parseEther("1"), timestamp + 4 * year);
        await dividendPool
          .connect(distributor)
          .distribute(testingRewardToken.address, parseEther("100"));
      });
      describe("claim()", () => {
        it("can claim rewards from next week", async () => {
          const aliceBal0 = await testingRewardToken.balanceOf(alice.address);
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal1 = await testingRewardToken.balanceOf(alice.address);
          expect(aliceBal1).eq(0);
          expect(aliceBal0).eq(0);
          await goTo(1 * week);
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal2 = await testingRewardToken.balanceOf(alice.address);
          almostEquals(
            aliceBal2.sub(aliceBal1),
            parseEther("100").mul(100).div(210)
          );
        });
        it("should not be double claimed", async () => {
          await goTo(1 * week);
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal0 = await testingRewardToken.balanceOf(alice.address);
          await goTo(1 * week);
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal1 = await testingRewardToken.balanceOf(alice.address);
          expect(aliceBal1).eq(aliceBal0);
        });
        it("should accumulate the rewards", async () => {
          const aliceBal0 = await testingRewardToken.balanceOf(alice.address);
          await goTo(1 * week);
          await dividendPool
            .connect(distributor)
            .distribute(testingRewardToken.address, parseEther("100"));
          await goTo(1 * week);
          await dividendPool
            .connect(distributor)
            .distribute(testingRewardToken.address, parseEther("100"));
          await goTo(1 * week);
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal1 = await testingRewardToken.balanceOf(alice.address);
          almostEquals(
            aliceBal1.sub(aliceBal0),
            parseEther("300").mul(100).div(210)
          );
        });
      });
      describe("claimUpTo()", () => {
        it("should be reverted since the target timestamp is bein updated", async () => {
          const timestamp = (await ethers.provider.getBlock("latest"))
            .timestamp;
          await expect(
            dividendPool
              .connect(alice)
              .claimUpTo(testingRewardToken.address, timestamp)
          ).to.be.reverted;
        });
        it("can claim after the epoch changes", async () => {
          const timestamp = (await ethers.provider.getBlock("latest"))
            .timestamp;
          await goTo(1 * week);
          await dividendPool
            .connect(alice)
            .claimUpTo(testingRewardToken.address, timestamp);
        });
      });
    });
  });

  describe("fork & emission sharing test", async () => {
    it("should share the emission with Master RIGHT holders", async () => {
      await goTo(1 * week);
      await votingEscrow.connect(alice).createLock(parseEther("10"), 208);
      // no sharing yet
      const claimable0 = await dividendPool
        .connect(alice)
        .claimable(forkedDAO.vision.address);
      expect(claimable0).eq(0);
      // automatic emission sharing
      const emissionAmount = await forkedDAO.visionEmitter.emission();
      await forkedDAO.visionEmitter.distribute();
      const claimable1 = await dividendPool
        .connect(alice)
        .claimable(forkedDAO.vision.address);
      // claimable from its next week
      expect(claimable1).eq(0);
      await goToNextWeek();
      const claimable2 = await dividendPool
        .connect(alice)
        .claimable(forkedDAO.vision.address);
      almostEquals(claimable2, emissionAmount.div(34));
    });
  });
});
