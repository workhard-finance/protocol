import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { parseEther } from "ethers/lib/utils";
import { almostEquals, goToNextWeek } from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  RIGHT,
  VISION,
  VotingEscrowLock,
  DAO,
  SquareRootVoteCounter,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("SquareRootVoteCounter.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let masterDAO: DAO;
  let vision: VISION;
  let votingEscrow: VotingEscrowLock;
  let right: RIGHT;
  let voteCounter: SquareRootVoteCounter;
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];
    carl = signers[3];
    masterDAO = await (await getWorkhard()).getMasterDAO({ account: deployer });
    vision = masterDAO.vision;
    votingEscrow = masterDAO.votingEscrow;
    right = masterDAO.right;
    const SquareRootVoteCounterFactory = await ethers.getContractFactory(
      "SquareRootVoteCounter"
    );
    voteCounter = (await SquareRootVoteCounterFactory.connect(
      deployer
    ).deploy()) as SquareRootVoteCounter;
    await voteCounter.initialize(right.address);
    const mineVision = async () => {
      await goToNextWeek();
      await masterDAO.visionEmitter.connect(deployer).distribute();
    };
    await mineVision();
    const prepare = async (account: SignerWithAddress) => {
      await vision
        .connect(deployer)
        .transfer(account.address, parseEther("300"));
      await vision
        .connect(account)
        .approve(votingEscrow.address, parseEther("10000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("getVotes()", async () => {
    beforeEach(async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      await votingEscrow.connect(alice).createLock(parseEther("100"), 4 * 52);
      await votingEscrow.connect(bob).createLock(parseEther("10"), 2 * 52);
      await votingEscrow.connect(carl).createLock(parseEther("100"), 1 * 52);
    });
    it("should be proportional to the square root of its staked and locked amount", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const aliceLockId = await votingEscrow.tokenOfOwnerByIndex(
        alice.address,
        0
      );
      const aliceVeVISION = await right.balanceOfAt(alice.address, timestamp);
      const bobLockId = await votingEscrow.tokenOfOwnerByIndex(bob.address, 0);
      const bobVeVISION = await right.balanceOfAt(bob.address, timestamp);
      const carlLockId = await votingEscrow.tokenOfOwnerByIndex(
        carl.address,
        0
      );
      const carlVeVISION = await right.balanceOfAt(carl.address, timestamp);
      const aliceVotes = await voteCounter.getVotes(aliceLockId, timestamp);
      const bobVotes = await voteCounter.getVotes(bobLockId, timestamp);
      const carlVotes = await voteCounter.getVotes(carlLockId, timestamp);
      almostEquals(
        aliceVotes.pow(2).mul(10000).div(aliceVeVISION),
        bobVotes.pow(2).mul(10000).div(bobVeVISION)
      );
      almostEquals(
        aliceVotes.pow(2).mul(10000).div(aliceVeVISION),
        carlVotes.pow(2).mul(10000).div(carlVeVISION)
      );
      expect(aliceVotes.pow(2).mul(10000).div(aliceVeVISION)).not.eq(0);
    });
  });
  describe("getters", () => {
    beforeEach(async () => {
      await votingEscrow.connect(bob).createLock(parseEther("10"), 2 * 52);
      await votingEscrow.connect(carl).createLock(parseEther("100"), 1 * 52);
    });
    describe("getTotalVotes()", () => {
      it("should return the square root of the total supply of rights", async () => {
        expect(
          (await voteCounter.getTotalVotes()).pow(2).div(parseEther("1"))
        ).to.eq((await right.totalSupply()).div(parseEther("1")));
      });
    });
    describe("getVotes()", () => {
      it("should return the square root of a lock's right balance at a specific timestamp", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const bobLockId = await votingEscrow.tokenOfOwnerByIndex(
          bob.address,
          0
        );
        expect(
          (await voteCounter.getVotes(bobLockId, timestamp))
            .pow(2)
            .div(parseEther("1"))
        ).to.eq(
          (await right.balanceOfLockAt(bobLockId, timestamp)).div(
            parseEther("1")
          )
        );
      });
    });
    describe("voterOf()", () => {
      it("should return the owner's address of a ve lock", async () => {
        const bobLockId = await votingEscrow.tokenOfOwnerByIndex(
          bob.address,
          0
        );
        expect(await voteCounter.voterOf(bobLockId)).to.eq(bob.address);
      });
      it("should return the delegatee's address once it's delegated to", async () => {
        const bobLockId = await votingEscrow.tokenOfOwnerByIndex(
          bob.address,
          0
        );
        await votingEscrow.connect(bob).delegate(bobLockId, carl.address);
        expect(await voteCounter.voterOf(bobLockId)).to.eq(carl.address);
      });
    });
    describe("votingRights()", () => {
      it("should return the usuable delegated voting rights", async () => {
        const carlLockId = await votingEscrow.tokenOfOwnerByIndex(
          carl.address,
          0
        );
        expect(await voteCounter.votingRights(carl.address)).to.deep.eq([
          carlLockId,
        ]);
        const bobLockId = await votingEscrow.tokenOfOwnerByIndex(
          bob.address,
          0
        );
        await votingEscrow.connect(bob).delegate(bobLockId, carl.address);
        expect(await voteCounter.votingRights(carl.address)).to.deep.eq([
          carlLockId,
          bobLockId,
        ]);
      });
    });
    describe("balanceOf()", () => {
      it("should return the summation of whole votes", async () => {
        expect(
          (await voteCounter.balanceOf(carl.address))
            .pow(2)
            .div(parseEther("1"))
        ).to.eq((await right.balanceOf(carl.address)).div(parseEther("1")));
      });
    });
    describe("veLock()", () => {
      it("should return the voting escrow locker contract's address", async () => {
        expect(await voteCounter.veLock()).to.eq(votingEscrow.address);
      });
    });
    describe("veToken()", () => {
      it("should return the voting escrow token contract's address", async () => {
        expect(await voteCounter.veToken()).to.eq(right.address);
      });
    });
  });
});
