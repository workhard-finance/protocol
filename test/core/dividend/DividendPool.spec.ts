import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import {
  almostEquals,
  goTo,
  goToNextWeek,
  runTimelockTx,
} from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DividendPool,
  ERC20,
  ERC20__factory,
  TimelockedGovernance,
  VISION,
  VotingEscrowLock,
  Project,
  Workhard,
  DAO,
  RIGHT,
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
  let workhard: Workhard;
  let project: Project;
  let masterDAO: DAO;
  let forkedDAO: DAO;
  let forkedDAOId: number;
  let vision: VISION;
  let right: RIGHT;
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
    workhard = await getWorkhard();
    project = workhard.project.connect(deployer);
    masterDAO = await workhard.getMasterDAO();
    vision = masterDAO.vision;
    right = masterDAO.right;
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
    await prepare(distributor);
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
    const fork = async () => {
      await project.createProject(0, "mockuri");
      const projId = await project.projectsOfDAOByIndex(
        0,
        (await project.projectsOf(0)).sub(1)
      );
      await project.upgradeToDAO(projId, {
        multisig: deployer.address,
        treasury: deployer.address,
        baseCurrency: masterDAO.baseCurrency.address,
        projectName: "Workhard Forked Dev",
        projectSymbol: "WFK",
        visionName: "Flovoured Vision",
        visionSymbol: "fVISION",
        commitName: "Flavoured Commit",
        commitSymbol: "fCOMMIT",
        rightName: "Flavoured Right",
        rightSymbol: "fRIGHT",
        emissionStartDelay: 86400 * 7,
        minDelay: 86400,
        voteLaunchDelay: 86400 * 7 * 4,
        initialEmission: parseEther("24000000"),
        minEmissionRatePerWeek: 60,
        emissionCutRate: 3000,
        founderShare: 500,
      });
      await project.launch(projId, 4750, 4750, 499, 1);
      return projId;
    };
    const forked = await fork();
    forkedDAOId = forked.toNumber();
    forkedDAO = await workhard.getDAO(forkedDAOId, { account: deployer });
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("Governance", async () => {
    describe("setFeaturedRewards()", () => {
      it("only governance can set the featured rewards list", async () => {
        const rewards = [workhard.commons.weth.address];
        await expect(
          dividendPool.connect(alice).setFeaturedRewards(rewards)
        ).to.be.revertedWith("Not authorized");
        await runTimelockTx(
          timelock.connect(deployer),
          dividendPool.populateTransaction.setFeaturedRewards(rewards)
        );
        expect(await dividendPool.featuredRewards()).to.deep.equal(rewards);
      });
    });
  });
  describe("epoch test", async () => {
    describe("getCurrentEpoch()", async () => {
      it("should start from 1 since the test starts after the 1st week", async () => {
        expect(await dividendPool.getCurrentEpoch()).eq(1);
      });
      it("should increment by weekly", async () => {
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
        await vision
          .connect(distributor)
          .approve(dividendPool.address, parseEther("100"));
        await dividendPool
          .connect(distributor)
          .distribute(vision.address, parseEther("100"));
        expect(await dividendPool.distributedTokens()).deep.eq([
          testingRewardToken.address,
          vision.address,
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
    describe("claimable() && claimStartWeek", () => {
      it("distribution should be claimable after 1 epoch", async () => {
        await goToNextWeek();
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
    describe("claim() & claimUpTo() & batchClaim()", async () => {
      beforeEach(async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await goToNextWeek();
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
        await vision
          .connect(distributor)
          .approve(dividendPool.address, parseEther("100"));
        await dividendPool
          .connect(distributor)
          .distribute(vision.address, parseEther("100"));
      });
      describe("claim()", () => {
        it("can claim rewards from next week", async () => {
          const aliceBal0 = await testingRewardToken.balanceOf(alice.address);
          const lockId = await votingEscrow.tokenOfOwnerByIndex(
            alice.address,
            0
          );
          expect(
            await dividendPool.claimStartWeek(
              testingRewardToken.address,
              lockId
            )
          ).to.eq(0);
          const currentWeekNum = await dividendPool.getCurrentEpoch();
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          expect(
            await dividendPool.claimStartWeek(
              testingRewardToken.address,
              lockId
            )
          ).to.eq(currentWeekNum);
          const aliceBal1 = await testingRewardToken.balanceOf(alice.address);
          expect(aliceBal1).eq(0);
          expect(aliceBal0).eq(0);
          await goToNextWeek();
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal2 = await testingRewardToken.balanceOf(alice.address);
          almostEquals(
            aliceBal2.sub(aliceBal1),
            parseEther("100").mul(100).div(210)
          );
        });
        it("should not be double claimed", async () => {
          await goToNextWeek();
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal0 = await testingRewardToken.balanceOf(alice.address);
          await goToNextWeek();
          await dividendPool.connect(alice).claim(testingRewardToken.address);
          const aliceBal1 = await testingRewardToken.balanceOf(alice.address);
          expect(aliceBal1).eq(aliceBal0);
        });
        it("should accumulate the rewards", async () => {
          const aliceBal0 = await testingRewardToken.balanceOf(alice.address);
          await goToNextWeek();
          await dividendPool
            .connect(distributor)
            .distribute(testingRewardToken.address, parseEther("100"));
          await goToNextWeek();
          await dividendPool
            .connect(distributor)
            .distribute(testingRewardToken.address, parseEther("100"));
          await goToNextWeek();
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
          await goToNextWeek();
          await dividendPool
            .connect(alice)
            .claimUpTo(testingRewardToken.address, timestamp);
        });
      });
      describe("claimUpBatch()", () => {
        it("can claim multi-asset rewards in 1 transaction", async () => {
          await goToNextWeek();
          const prevVisionBal = await vision.balanceOf(alice.address);
          const prevRewardTokenBal = await testingRewardToken.balanceOf(
            alice.address
          );
          await dividendPool
            .connect(alice)
            .claimBatch([testingRewardToken.address, vision.address]);
          const updatedVisionBal = await vision.balanceOf(alice.address);
          const updatedRewardTokenBal = await testingRewardToken.balanceOf(
            alice.address
          );
          expect(updatedVisionBal.gt(prevVisionBal)).to.be.true;
          expect(updatedRewardTokenBal.gt(prevRewardTokenBal)).to.be.true;
        });
      });
    });
    describe("redistribute()", async () => {
      it("should redistribute the rewards to the closest epoch that has any locked values", async () => {
        const epochOfZeroLockedVision = await dividendPool.getCurrentEpoch();
        // no locked vision
        expect(await right.totalSupply()).to.eq(0);
        await dividendPool
          .connect(distributor)
          .distribute(testingRewardToken.address, parseEther("100"));
        // distributed but no locked vision for that week
        await goToNextWeek();
        expect(
          await dividendPool
            .connect(alice)
            .claimable(testingRewardToken.address)
        ).to.equal(0);
        // create a lock
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await votingEscrow
          .connect(alice)
          .createLockUntil(parseEther("1"), timestamp + 4 * year);
        await goToNextWeek();
        // still 0 claimable after 1 week
        expect(
          await dividendPool
            .connect(alice)
            .claimable(testingRewardToken.address)
        ).to.equal(0);
        // run redistribution as there were no beneficiary of the distribution.
        await dividendPool
          .connect(distributor)
          .redistribute(testingRewardToken.address, epochOfZeroLockedVision);
        // now alice can claim the reward
        almostEquals(
          await dividendPool
            .connect(alice)
            .claimable(testingRewardToken.address),
          parseEther("100")
        );
      });
    });
  });

  describe("fork & emission sharing test", async () => {
    it("should share the emission with Master RIGHT holders", async () => {
      await goToNextWeek();
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
  describe("getters", () => {
    describe("genesis()", () => {
      it("should return the genesis timestamp when the dividend pool is initialized", async () => {
        expect(await dividendPool.genesis()).to.be.gt(0);
        expect(await dividendPool.genesis()).lt(
          (await ethers.provider.getBlock("latest")).timestamp
        );
      });
    });
    describe("veVISION()", () => {
      it("should return right token address", async () => {
        expect(await dividendPool.veVISION()).to.eq(right.address);
      });
    });
    describe("veLocker()", () => {
      it("should return the voting escrow locker address", async () => {
        expect(await dividendPool.veLocker()).to.eq(votingEscrow.address);
      });
    });
  });
});
