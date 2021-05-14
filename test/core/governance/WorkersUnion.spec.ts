import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { constants, PopulatedTransaction, BigNumberish } from "ethers";
import { BytesLike, parseEther } from "ethers/lib/utils";
import { goTo } from "../../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../../scripts/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  RIGHT,
  TimelockedGovernance,
  VISION,
  VoteCounter,
  VotingEscrowLock,
  WorkersUnion,
} from "../../../src";

chai.use(solidity);

describe("WorkersUnion.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let planter: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let fixture: MiningFixture;
  let vision: VISION;
  let veLocker: VotingEscrowLock;
  let workersUnion: WorkersUnion;
  let timelock: TimelockedGovernance;
  let voteCounter: VoteCounter;
  let right: RIGHT;
  let pTx: PopulatedTransaction;
  let params: {
    target: string;
    value: BigNumberish;
    data: BytesLike;
    predecessor: BytesLike;
    salt: BytesLike;
    startsIn: number;
    votingPeriod: number;
  };
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
    right = fixture.right;
    voteCounter = fixture.voteCounter;
    workersUnion = fixture.workersUnion;
    timelock = fixture.timelock;
    voteCounter = fixture.voteCounter;
    const prepare = async (account: SignerWithAddress) => {
      await vision.mint(account.address, parseEther("1000000"));
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
    pTx = await workersUnion.populateTransaction.changeVotingRule(
      3600 * 24 * 2,
      3600 * 24 * 7,
      3600 * 24 * 2,
      3600 * 24 * 7,
      0,
      0,
      voteCounter.address
    );
    params = {
      target: pTx.to,
      value: pTx.value || 0,
      data: pTx.data,
      predecessor: constants.HashZero,
      salt: constants.HashZero,
      startsIn: 3600 * 24,
      votingPeriod: 3600 * 24 * 7,
    };
    txHash = await timelock.hashOperation(
      pTx.to,
      pTx.value || 0,
      pTx.data,
      constants.HashZero,
      constants.HashZero
    );
  });
  describe("launch()", async () => {
    it("should be launched after 4 weeks", async () => {
      await expect(workersUnion.launch()).to.be.revertedWith(
        "Wait a bit please."
      );
      await goTo(3600 * 24 * 7 * 4);
      await expect(workersUnion.launch()).not.to.be.reverted;
      expect(await workersUnion.paused()).to.be.false;
    });
    it("should not accept any tx before it's launched", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            params.startsIn,
            params.votingPeriod
          )
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
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            params.startsIn,
            params.votingPeriod
          )
      )
        .to.emit(workersUnion, "TxProposed")
        .withArgs(
          ...[
            txHash,
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            nextTimestamp + params.startsIn,
            nextTimestamp + params.startsIn + params.votingPeriod,
          ]
        );
    });
    it("should revert when the proposer does not have enough voting power", async () => {
      await expect(
        workersUnion
          .connect(carl)
          .proposeTx(
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            params.startsIn,
            params.votingPeriod
          )
      ).to.be.revertedWith("Not enough votes for proposing.");
    });
    it("should revert when the pending period is too short", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            3600 * 23,
            3600 * 24 * 7
          )
      ).to.be.revertedWith("Pending period is too short.");
    });
    it("should revert when the pending period is too long", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            3600 * 24 * 8,
            3600 * 24 * 7
          )
      ).to.be.revertedWith("Pending period is too long.");
    });
    it("should revert when the voting period is too short", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            3600 * 24 * 1,
            3600 * 24 * 6
          )
      ).to.be.revertedWith("Voting period is too short.");
    });
    it("should revert when the voting period is too long", async () => {
      await expect(
        workersUnion
          .connect(alice)
          .proposeTx(
            params.target,
            params.value,
            params.data,
            params.predecessor,
            params.salt,
            3600 * 24 * 1,
            3600 * 24 * 29
          )
      ).to.be.revertedWith("Voting period is too long.");
    });
  });
  describe("vote()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion
        .connect(alice)
        .proposeTx(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt,
          params.startsIn,
          params.votingPeriod
        );
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

      const forVotes0 = (await workersUnion.proposals(txHash)).totalForVotes;
      await workersUnion.connect(alice).vote(txHash, true);
      const forVotes1 = (await workersUnion.proposals(txHash)).totalForVotes;
      const againstVotes1 = (await workersUnion.proposals(txHash))
        .totalAgainstVotes;
      expect(forVotes0).eq(forVotes1);
      await workersUnion.connect(alice).vote(txHash, false);
      const forVotes2 = (await workersUnion.proposals(txHash)).totalForVotes;
      const againstVotes2 = (await workersUnion.proposals(txHash))
        .totalAgainstVotes;
      expect(forVotes1.sub(forVotes2)).eq(againstVotes2.sub(againstVotes1));
    });
  });
  describe("schedule() & execute()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion
        .connect(alice)
        .proposeTx(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt,
          params.startsIn,
          params.votingPeriod
        );
      await goTo(3600 * 24 * 2);
    });
    it("should be executed when it's total for votes is greater than the minimum", async () => {
      await workersUnion.connect(bob).vote(txHash, true);
      await goTo(3600 * 24 * 7);
      await expect(
        workersUnion.schedule(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt
        )
      ).to.emit(timelock, "CallScheduled");
    });
    it("should not execute the tx when its for vote is less than the minimum", async () => {
      await workersUnion.connect(carl).vote(txHash, true);
      await goTo(3600 * 24 * 7);
      await expect(
        workersUnion.schedule(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt
        )
      ).to.be.revertedWith("vote is not passed");
    });
    it("should not execute the tx when it's total against votes is greater than for votes", async () => {
      await workersUnion.connect(alice).vote(txHash, true);
      await workersUnion.connect(bob).vote(txHash, false);
      await goTo(3600 * 24 * 7);
      await expect(
        workersUnion.schedule(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt
        )
      ).to.be.revertedWith("vote is not passed");
    });
    it("should be executed when after the minimum time lock", async () => {
      await workersUnion.connect(bob).vote(txHash, true);
      await goTo(3600 * 24 * 7);
      await expect(
        workersUnion.schedule(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt
        )
      ).to.emit(timelock, "CallScheduled");
      await goTo(3600 * 24 * 2);
      await expect(
        workersUnion.execute(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt
        )
      ).to.emit(timelock, "CallExecuted");
    });
  });

  describe("changeVotingRule()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion
        .connect(alice)
        .proposeTx(
          params.target,
          params.value,
          params.data,
          params.predecessor,
          params.salt,
          params.startsIn,
          params.votingPeriod
        );
      await goTo(3600 * 24 * 2);
      await workersUnion.connect(bob).vote(txHash, true);
      await goTo(3600 * 24 * 7);
    });
    it("should update the votingRule", async () => {
      await workersUnion.schedule(
        params.target,
        params.value,
        params.data,
        params.predecessor,
        params.salt
      );
      await goTo(3600 * 24 * 1);
      await workersUnion.execute(
        params.target,
        params.value,
        params.data,
        params.predecessor,
        params.salt
      );
      const newVotingRule = await workersUnion.votingRule();
      expect(newVotingRule.minimumPending).eq(newVotingRule[0]);
      expect(newVotingRule.maximumPending).eq(newVotingRule[1]);
      expect(newVotingRule.minimumVotingPeriod).eq(newVotingRule[2]);
      expect(newVotingRule.maximumVotingPeriod).eq(newVotingRule[3]);
      expect(newVotingRule.minimumVotesForProposing).eq(newVotingRule[4]);
      expect(newVotingRule.minimumVotes).eq(newVotingRule[5]);
    });
  });
  describe("proposeBatchTx() & executeBatchTx", async () => {
    let batchTxHash: string;
    let batchTxParams: {
      target: string[];
      value: BigNumberish[];
      data: BytesLike[];
      predecessor: BytesLike;
      salt: BytesLike;
      startsIn: BigNumberish;
      votingPeriod: BigNumberish;
    };
    beforeEach(async () => {
      batchTxParams = {
        target: Array(3).fill(params.target),
        value: Array(3).fill(params.value),
        data: Array(3).fill(params.data),
        predecessor: constants.HashZero,
        salt: constants.HashZero,
        startsIn: 3600 * 24,
        votingPeriod: 3600 * 24 * 7,
      };
      batchTxHash = await timelock.hashOperationBatch(
        batchTxParams.target,
        batchTxParams.value,
        batchTxParams.data,
        batchTxParams.predecessor,
        batchTxParams.salt
      );
      await goTo(3600 * 24 * 7 * 4);
      await workersUnion.launch();
      await workersUnion
        .connect(alice)
        .proposeBatchTx(
          batchTxParams.target,
          batchTxParams.value,
          batchTxParams.data,
          batchTxParams.predecessor,
          batchTxParams.salt,
          batchTxParams.startsIn,
          batchTxParams.votingPeriod
        );
      await goTo(3600 * 24 * 2);
      await workersUnion.connect(bob).vote(batchTxHash, true);
      await goTo(3600 * 24 * 7);
    });
    it("should update the votingRule correctly", async () => {
      await expect(
        workersUnion.scheduleBatch(
          batchTxParams.target,
          batchTxParams.value,
          batchTxParams.data,
          batchTxParams.predecessor,
          batchTxParams.salt
        )
      ).to.emit(timelock, "CallScheduled");
      await goTo(3600 * 24 * 1);
      await workersUnion.executeBatch(
        batchTxParams.target,
        batchTxParams.value,
        batchTxParams.data,
        batchTxParams.predecessor,
        batchTxParams.salt
      );
      const newVotingRule = await workersUnion.votingRule();
      expect(newVotingRule.minimumPending).eq(newVotingRule[0]);
      expect(newVotingRule.maximumPending).eq(newVotingRule[1]);
      expect(newVotingRule.minimumVotingPeriod).eq(newVotingRule[2]);
      expect(newVotingRule.maximumVotingPeriod).eq(newVotingRule[3]);
      expect(newVotingRule.minimumVotesForProposing).eq(newVotingRule[4]);
      expect(newVotingRule.minimumVotes).eq(newVotingRule[5]);
    });
  });
});
