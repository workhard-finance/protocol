import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { parseEther } from "ethers/lib/utils";
import { almostEquals, goToNextWeek } from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  RIGHT,
  VISION,
  VoteCounter,
  VotingEscrowLock,
  WorkhardDAO,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("VoteCounter.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let planter: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let masterDAO: WorkhardDAO;
  let vision: VISION;
  let votingEscrow: VotingEscrowLock;
  let right: RIGHT;
  let voteCounter: VoteCounter;
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    planter = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    masterDAO = await (await getWorkhard()).getMasterDAO({ account: deployer });
    vision = masterDAO.vision;
    votingEscrow = masterDAO.votingEscrow;
    right = masterDAO.right;
    voteCounter = masterDAO.voteCounter;
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
      almostEquals(aliceVotes, aliceVeVISION);
      almostEquals(bobVotes, bobVeVISION);
      almostEquals(carlVotes, carlVeVISION);
      // No more square root
      // almostEquals(
      //   aliceVotes.pow(2).mul(10000).div(aliceVeVISION),
      //   bobVotes.pow(2).mul(10000).div(bobVeVISION)
      // );
      // almostEquals(
      //   aliceVotes.pow(2).mul(10000).div(aliceVeVISION),
      //   carlVotes.pow(2).mul(10000).div(carlVeVISION)
      // );
      // expect(aliceVotes.pow(2).mul(10000).div(aliceVeVISION)).not.eq(0);
    });
  });
});
