import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { almostEquals, goTo } from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ERC20,
  ERC20__factory,
  VotingEscrowLock,
  VotingEscrowLock__factory,
  VotingEscrowToken,
  VotingEscrowToken__factory,
} from "../../../src";

chai.use(solidity);

describe("VotingEscrowToken.sol", function () {
  let signers: SignerWithAddress[];
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let token: ERC20;
  let veToken: VotingEscrowToken;
  let votingEscrow: VotingEscrowLock;
  before(async () => {
    signers = await ethers.getSigners();
    alice = signers[0];
    bob = signers[1];
    carl = signers[2];
    token = await new ERC20__factory(alice).deploy();
    veToken = await new VotingEscrowToken__factory(alice).deploy();
    votingEscrow = await new VotingEscrowLock__factory(alice).deploy();
    await votingEscrow["initialize(string,string,address,address,address)"](
      "VE LOCKER",
      "VEL",
      token.address,
      veToken.address,
      alice.address
    );
    await veToken.initialize(
      "Voting Escrow Token",
      "veToken",
      votingEscrow.address
    );
    const prepare = async (account: SignerWithAddress) => {
      await token.mint(account.address, parseEther("10000"));
      await token
        .connect(account)
        .approve(votingEscrow.address, parseEther("10000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);

    const MAX = (await votingEscrow.MAXTIME()) as BigNumber;
    const expectBalances = async (
      aliceBal: string,
      bobBal: string,
      carlBal: string,
      totalSupply: string
    ) => {
      almostEquals(
        await veToken.balanceOf(alice.address),
        parseEther(aliceBal)
      );
      almostEquals(await veToken.balanceOf(bob.address), parseEther(bobBal));
      almostEquals(await veToken.balanceOf(carl.address), parseEther(carlBal));
      almostEquals(await veToken.totalSupply(), parseEther(totalSupply));
    };
    // 1-1. alice staked and lock 10000 * 4 yeras
    // 1-2. bob staked and lock 5000 * 3 yeras
    // total supply ~= 13750 (alice: 10000, bob: 3750)
    await votingEscrow.connect(alice).createLock(parseEther("10000"), 4 * 52);
    await votingEscrow.connect(bob).createLock(parseEther("5000"), 3 * 52);
    await expectBalances("10000", "3750", "0", "13750");

    // 1 years later: total supply ~= 10000 (alice: 7500, bob: 2500)
    await goTo(86400 * 365 * 1);
    await expectBalances("7500", "2500", "0", "10000");
    // 2 yeras later: total supply ~= 6250 (alice: 5000, bob: 1250)
    const aliceLock = await votingEscrow.tokenOfOwnerByIndex(alice.address, 0);
    const bobLock = await votingEscrow.tokenOfOwnerByIndex(bob.address, 0);
    await goTo(86400 * 365 * 1);
    await expectBalances("5000", "1250", "0", "6250");
    // 2-1. alice extended the lock again to 4 years
    // 2-2. bob increased lock amount to 10000
    // 2-3. carl staked and lock 5000 * 4 yeras
    // 2 years later + 1: total supply ~= 17500 (alice: 10000, bob: 2500, carl: 5000)
    const timestamp2 = (await ethers.provider.getBlock("latest")).timestamp;
    await votingEscrow
      .connect(alice)
      .extendLockUntil(aliceLock, MAX.add(timestamp2));
    await votingEscrow.connect(bob).increaseAmount(bobLock, parseEther("5000"));
    await votingEscrow.connect(carl).createLock(parseEther("5000"), 4 * 52);
    await expectBalances("10000", "2500", "5000", "17500");
    // 3 yeras later
    // total supply ~= 11250 (alice: 7500, bob: 0, carl: 3750)
    await goTo(86400 * 365 * 1);
    await expectBalances("7500", "0", "3750", "11250");
    await votingEscrow.connect(bob).withdraw(bobLock);
    // 4 yeras later
    // total supply ~= 7500 (alice: 5000, bob: 0, carl: 2500)
    await goTo(86400 * 365 * 1);
    await expectBalances("5000", "0", "2500", "7500");
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("balanceOfAt()", async () => {
    describe("alice", () => {
      it("should return 0 before the lock exists (alice)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const balance = await veToken.balanceOfAt(
          alice.address,
          timestamp - 86400 * 365 * 4 - 10
        );
        expect(balance).eq(0);
      });

      it("should return 10000 (alice 10000 * 4year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          alice.address,
          timestamp - 86400 * 365 * 4
        );
        almostEquals(veBal, parseEther("10000"));
      });
      it("should return 7500 (alice 10000 * 3year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          alice.address,
          timestamp - 86400 * 365 * 3
        );
        almostEquals(veBal, parseEther("7500"));
      });
      it("should return 5000 (alice 10000 * 2year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          alice.address,
          timestamp - 86400 * 365 * 2 - 10
        );
        almostEquals(veBal, parseEther("5000"));
      });
      it("should return 10000 (alice 10000 * extended to 4year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          alice.address,
          timestamp - 86400 * 365 * 2 + 10
        );
        almostEquals(veBal, parseEther("10000"));
      });
      it("should return 7500 (alice 10000 * 3year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          alice.address,
          timestamp - 86400 * 365 * 1
        );
        almostEquals(veBal, parseEther("7500"));
      });
      it("should return 5000 (alice 10000 * 2year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          alice.address,
          timestamp - 86400 * 365 * 0
        );
        almostEquals(veBal, parseEther("5000"));
      });
    });
    describe("bob", () => {
      it("should return 0 before the lock exists (bob)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const balance = await veToken.balanceOfAt(
          bob.address,
          timestamp - 86400 * 365 * 4 - 10
        );
        expect(balance).eq(0);
      });

      it("should return 3750 (bob 5000 * 3year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          bob.address,
          timestamp - 86400 * 365 * 4
        );
        almostEquals(veBal, parseEther("3750"));
      });
      it("should return 2500 (bob 5000 * 2year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          bob.address,
          timestamp - 86400 * 365 * 3
        );
        almostEquals(veBal, parseEther("2500"));
      });
      it("should return 1250 (bob 5000 * 1year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          bob.address,
          timestamp - 86400 * 365 * 2 - 10
        );
        almostEquals(veBal, parseEther("1250"));
      });
      it("should return 2500 (bob increased amount to 10000 * 1year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          bob.address,
          timestamp - 86400 * 365 * 2 + 10
        );
        almostEquals(veBal, parseEther("2500"));
      });
      it("should return 0 (bob 10000 * 0year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          bob.address,
          timestamp - 86400 * 365 * 1
        );
        almostEquals(veBal, parseEther("0"));
      });
    });
    describe("carl", () => {
      it("should return 0 before the lock exists (carl)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const balance = await veToken.balanceOfAt(
          carl.address,
          timestamp - 86400 * 365 * 2 - 10
        );
        expect(balance).eq(0);
      });

      it("should return 5000 (carl increased amount to 5000 * 4year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          carl.address,
          timestamp - 86400 * 365 * 2 + 10
        );
        almostEquals(veBal, parseEther("5000"));
      });
      it("should return 3750 (carl 5000 * 3year lock)", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const veBal = await veToken.balanceOfAt(
          carl.address,
          timestamp - 86400 * 365 * 1
        );
        almostEquals(veBal, parseEther("3750"));
      });
    });
  });
  describe("totalSupplyAt()", async () => {
    it("should return 0 when there is no lock", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const veBal = await veToken.totalSupplyAt(
        timestamp - 86400 * 365 * 4 - 10
      );
      almostEquals(veBal, parseEther("0"));
    });
    it("should return 13750 (alice: 10000, bob: 3750)", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const veBal = await veToken.totalSupplyAt(timestamp - 86400 * 365 * 4);
      almostEquals(veBal, parseEther("13750"));
    });
    it("should return 10000 (alice: 7500, bob: 2500)", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const veBal = await veToken.totalSupplyAt(timestamp - 86400 * 365 * 3);
      almostEquals(veBal, parseEther("10000"));
    });
    it("should return 6250 (alice: 5000, bob: 1250)", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const veBal = await veToken.totalSupplyAt(
        timestamp - 86400 * 365 * 2 - 10
      );
      almostEquals(veBal, parseEther("6250"));
    });
    it("should return 17500 (alice: 10000, bob: 2500, carl: 5000)", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const veBal = await veToken.totalSupplyAt(
        timestamp - 86400 * 365 * 2 + 10
      );
      almostEquals(veBal, parseEther("17500"));
    });
    it("should return 11250 (alice: 7500, bob: 0, carl: 3750)", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const veBal = await veToken.totalSupplyAt(timestamp - 86400 * 365 * 1);
      almostEquals(veBal, parseEther("11250"));
    });
    it("should return 7500 (alice: 5000, bob: 0, carl: 2500)", async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const veBal = await veToken.totalSupplyAt(timestamp - 86400 * 365 * 0);
      almostEquals(veBal, parseEther("7500"));
    });
  });
  describe("VotingEscrowLock.sol", () => {
    describe("withdraw()", async () => {
      it("should revert since Alice's stake is still locked", async () => {
        const aliceLock = await votingEscrow.tokenOfOwnerByIndex(
          alice.address,
          0
        );
        await expect(votingEscrow.connect(alice).withdraw(aliceLock)).to.be
          .reverted;
      });
      it("should withdraw fund after Alice's lock ends", async () => {
        await goTo(86400 * 365 * 2);
        const aliceLock = await votingEscrow.tokenOfOwnerByIndex(
          alice.address,
          0
        );
        await expect(votingEscrow.connect(alice).withdraw(aliceLock))
          .to.emit(votingEscrow, "Withdraw")
          .withArgs(aliceLock, parseEther("10000"));
      });
    });
    describe("totalLockedSupply()", async () => {
      it("should return 15000: alice 10000, carl: 5000", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const totalLockedSupply = await votingEscrow.totalLockedSupply();
        expect(totalLockedSupply).eq(parseEther("15000"));
      });
    });
  });
});
