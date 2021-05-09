import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, constants, PopulatedTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { goTo } from "../../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../../scripts/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe.only("WorkersUnion.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let planter: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let fixture: MiningFixture;
  let vision: Contract;
  let veLocker: Contract;
  let workersUnion: Contract;
  let timelock: Contract;
  let voteCounter: Contract;
  let veVISION: Contract;
  let newMemorandom: any[];
  let pTx: PopulatedTransaction;
  let params: any[];
  let txHash: string;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    planter = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    fixture = await getMiningFixture({ skipMinterSetting: true });
    vision = fixture.vision;
    veLocker = fixture.veLocker;
    veVISION = fixture.veVISION;
    voteCounter = fixture.voteCounter;
    workersUnion = fixture.workersUnion;
    timelock = fixture.timelock;
    voteCounter = fixture.voteCounter;
    const prepare = async (account: SignerWithAddress) => {
      const addr = await account.getAddress();
      await vision.mint(addr, parseEther("1000000"));
      await vision
        .connect(account)
        .approve(veLocker.address, parseEther("1000000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
    await veLocker.connect(alice).createLock(parseEther("1000"), 40);
    await veLocker.connect(bob).createLock(parseEther("100000"), 20);
    await veLocker.connect(carl).createLock(parseEther("100"), 4);
    await goTo(86400 * 7);
    console.log(await voteCounter.callStatic.getTotalVotes());
    console.log(await veVISION.callStatic.totalSupply());
    newMemorandom = [
      3600 * 24 * 2,
      3600 * 24 * 7,
      3600 * 24 * 2,
      3600 * 24 * 7,
      0,
      0,
      voteCounter.address,
    ];
    pTx = await workersUnion.populateTransaction.changeMemorandom(
      ...newMemorandom
    );
    params = [
      pTx.to,
      pTx.value || 0,
      pTx.data,
      constants.HashZero,
      constants.HashZero,
      3600 * 24,
      3600 * 24 * 7,
    ];
    txHash = await timelock.callStatic.hashOperation(...params.slice(0, 5));
  });
  describe("launch()", async () => {
    it("should be launched after 4 weeks", async () => {
      await expect(workersUnion.launch()).to.be.revertedWith(
        "Wait a bit please."
      );
      await goTo(3600 * 24 * 7 * 4);
      await expect(workersUnion.launch()).not.to.be.reverted;
      expect(await workersUnion.callStatic.paused()).to.be.false;
    });
    it("should not accept any tx before it's launched", async () => {
      await expect(
        workersUnion.connect(alice).proposeTx(...params)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
  describe("proposeTx()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
    });
    it("should propose a new tx and start voting", async () => {
      const currentTimestamp = (await ethers.provider.getBlock("latest"))
        .timestamp as number;
      const nextTimestamp = currentTimestamp + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [nextTimestamp]);
      await expect(workersUnion.connect(alice).proposeTx(...params))
        .to.emit(workersUnion, "TxProposed")
        .withArgs(
          ...[
            txHash,
            ...params.slice(0, 5),
            nextTimestamp + params[5],
            nextTimestamp + params[5] + params[6],
          ]
        );
    });
    it("should revert when the proposer does not have enough voting power", async () => {
      await expect(
        workersUnion.connect(carl).proposeTx(...params)
      ).to.be.revertedWith("Not enough votes for proposing.");
    });
    it("should revert when the pending period is too short", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 23, 3600 * 24 * 7)
      ).to.be.revertedWith("Pending period is too short.");
    });
    it("should revert when the pending period is too long", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 24 * 8, 3600 * 24 * 7)
      ).to.be.revertedWith("Pending period is too long.");
    });
    it("should revert when the voting period is too short", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 24 * 1, 3600 * 24 * 6)
      ).to.be.revertedWith("Voting period is too short.");
    });
    it("should revert when the voting period is too long", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 24 * 1, 3600 * 24 * 29)
      ).to.be.revertedWith("Voting period is too long.");
    });
  });
  describe("vote()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion.connect(alice).proposeTx(...params);
    });
    it("should revert during the pending period", async () => {
      await expect(
        workersUnion.connect(alice).vote(txHash, true)
      ).to.be.revertedWith("Not in the voting period");
    });
    it("should revert after the voting period", async () => {
      await goTo(3600 * 24 * 7 * 5);
      await expect(
        workersUnion.connect(alice).vote(txHash, true)
      ).to.be.revertedWith("Not in the voting period");
    });
    it("should vote and increase the for vote", async () => {
      await goTo(3600 * 24 * 2);
      await expect(workersUnion.connect(alice).vote(txHash, true))
        .to.emit(workersUnion, "Vote")
        .withArgs(txHash, alice.address, true);
    });
    it("should not be double-voteable", async () => {
      await goTo(3600 * 24 * 2);
      await workersUnion.connect(alice).vote(txHash, true);

      const forVotes0 = (await workersUnion.callStatic.proposals(txHash))
        .totalForVotes;
      await workersUnion.connect(alice).vote(txHash, true);
      const forVotes1 = (await workersUnion.callStatic.proposals(txHash))
        .totalForVotes;
      const againstVotes1 = (await workersUnion.callStatic.proposals(txHash))
        .totalAgainstVotes;
      expect(forVotes0).eq(forVotes1);
      await workersUnion.connect(alice).vote(txHash, false);
      const forVotes2 = (await workersUnion.callStatic.proposals(txHash))
        .totalForVotes;
      const againstVotes2 = (await workersUnion.callStatic.proposals(txHash))
        .totalAgainstVotes;
      expect(forVotes1.sub(forVotes2)).eq(againstVotes2.sub(againstVotes1));
    });
  });
  describe("schedule() & execute()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion.connect(alice).proposeTx(...params);
      await goTo(3600 * 24 * 2);
    });
    it("should be executed when it's total for votes is greater than the minimum", async () => {
      await workersUnion.connect(bob).vote(txHash, true);
      await goTo(3600 * 24 * 7);
      await expect(workersUnion.schedule(...params.slice(0, 5))).to.emit(
        timelock,
        "CallScheduled"
      );
    });
    it("should not execute the tx when its for vote is less than the minimum", async () => {
      await workersUnion.connect(alice).vote(txHash, true);
      await goTo(3600 * 24 * 7);
      await expect(
        workersUnion.schedule(...params.slice(0, 5))
      ).to.be.revertedWith("vote is not passed");
    });
    it("should not execute the tx when it's total against votes is greater than for votes", async () => {
      await workersUnion.connect(alice).vote(txHash, true);
      await workersUnion.connect(bob).vote(txHash, false);
      await goTo(3600 * 24 * 7);
      await expect(
        workersUnion.schedule(...params.slice(0, 5))
      ).to.be.revertedWith("vote is not passed");
    });
    it("should be executed when after the minimum time lock", async () => {
      await workersUnion.connect(bob).vote(txHash, true);
      await goTo(3600 * 24 * 7);
      await expect(workersUnion.schedule(...params.slice(0, 5))).to.emit(
        timelock,
        "CallScheduled"
      );
      await goTo(3600 * 24 * 2);
      await expect(workersUnion.execute(...params.slice(0, 5))).to.emit(
        timelock,
        "CallExecuted"
      );
    });
  });

  describe("changeMemorandom()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion.connect(alice).proposeTx(...params);
      await goTo(3600 * 24 * 2);
      await workersUnion.connect(bob).vote(txHash, true);
      await goTo(3600 * 24 * 7);
    });
    it("should update the memorandom", async () => {
      await workersUnion.schedule(...params.slice(0, 5));
      await goTo(3600 * 24 * 1);
      await workersUnion.execute(...params.slice(0, 5));
      const newMemorandom = await workersUnion.callStatic.memorandom();
      expect(newMemorandom.minimumPending).eq(newMemorandom[0]);
      expect(newMemorandom.maximumPending).eq(newMemorandom[1]);
      expect(newMemorandom.minimumVotingPeriod).eq(newMemorandom[2]);
      expect(newMemorandom.maximumVotingPeriod).eq(newMemorandom[3]);
      expect(newMemorandom.minimumVotesForProposing).eq(newMemorandom[4]);
      expect(newMemorandom.minimumVotes).eq(newMemorandom[5]);
    });
  });
  describe("proposeBatchTx() & executeBatchTx", async () => {
    let batchTxHash: string;
    let batchTxParams: any[];
    beforeEach(async () => {
      batchTxParams = [
        Array(3).fill(params[0]),
        Array(3).fill(params[1]),
        Array(3).fill(params[2]),
        constants.HashZero,
        constants.HashZero,
        3600 * 24,
        3600 * 24 * 7,
      ];
      batchTxHash = await timelock.callStatic.hashOperationBatch(
        ...batchTxParams.slice(0, 5)
      );
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion.connect(alice).proposeBatchTx(...batchTxParams);
      await goTo(3600 * 24 * 2);
      await workersUnion.connect(bob).vote(batchTxHash, true);
      await goTo(3600 * 24 * 7);
    });
    it("should update the memorandom correctly", async () => {
      await expect(
        workersUnion.scheduleBatch(...batchTxParams.slice(0, 5))
      ).to.emit(timelock, "CallScheduled");
      await goTo(3600 * 24 * 1);
      await workersUnion.executeBatch(...batchTxParams.slice(0, 5));
      const newMemorandom = await workersUnion.callStatic.memorandom();
      expect(newMemorandom.minimumPending).eq(newMemorandom[0]);
      expect(newMemorandom.maximumPending).eq(newMemorandom[1]);
      expect(newMemorandom.minimumVotingPeriod).eq(newMemorandom[2]);
      expect(newMemorandom.maximumVotingPeriod).eq(newMemorandom[3]);
      expect(newMemorandom.minimumVotesForProposing).eq(newMemorandom[4]);
      expect(newMemorandom.minimumVotes).eq(newMemorandom[5]);
    });
  });
});
