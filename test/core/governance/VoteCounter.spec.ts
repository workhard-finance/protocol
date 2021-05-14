import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { almostEquals, goTo, sqrt } from "../../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../../scripts/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe("SquareRootVoteCounter.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let planter: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let deployerAddress: string;
  let planterAddress: string;
  let aliceAddress: string;
  let bobAddress: string;
  let carlAddress: string;
  let fixture: MiningFixture;
  let vision: Contract;
  let veLocker: Contract;
  let right: Contract;
  let voteCounter: Contract;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    planter = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    deployerAddress = await deployer.getAddress();
    planterAddress = await planter.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carlAddress = await carl.getAddress();
    fixture = await getMiningFixture({ skipMinterSetting: true });
    vision = fixture.vision;
    veLocker = fixture.veLocker;
    right = fixture.right;
    voteCounter = fixture.voteCounter;
    const prepare = async (account: SignerWithAddress) => {
      const addr = await account.getAddress();
      await vision.mint(addr, parseEther("10000"));
      await vision
        .connect(account)
        .approve(veLocker.address, parseEther("10000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
  });
  describe("getVotes()", async () => {
    beforeEach(async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      await veLocker.connect(alice).createLock(parseEther("100"), 4 * 52);
      await veLocker.connect(bob).createLock(parseEther("10"), 2 * 52);
      await veLocker.connect(carl).createLock(parseEther("100"), 1 * 52);
    });
    it("should be proportional to the square root of its staked and locked amount", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const aliceLockId = await veLocker.callStatic.tokenOfOwnerByIndex(
        alice.address,
        0
      );
      const aliceVeVISION = await right.callStatic.balanceOfAt(
        alice.address,
        timestamp
      );
      const bobLockId = await veLocker.callStatic.tokenOfOwnerByIndex(
        bob.address,
        0
      );
      const bobVeVISION = await right.callStatic.balanceOfAt(
        bob.address,
        timestamp
      );
      const carlLockId = await veLocker.callStatic.tokenOfOwnerByIndex(
        carl.address,
        0
      );
      const carlVeVISION = await right.callStatic.balanceOfAt(
        carl.address,
        timestamp
      );
      const aliceVotes = await voteCounter.callStatic.getVotes(
        aliceLockId,
        timestamp
      );
      const bobVotes = await voteCounter.callStatic.getVotes(
        bobLockId,
        timestamp
      );
      const carlVotes = await voteCounter.callStatic.getVotes(
        carlLockId,
        timestamp
      );
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
});
