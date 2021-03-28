import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, constants, PopulatedTransaction } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { goTo } from "../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../scripts/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe("FarmersUnion.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let planter: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let fixture: MiningFixture;
  let visionToken: Contract;
  let visionFarm: Contract;
  let farmersUnion: Contract;
  let voteCounter: Contract;
  let newMemorandom: any[];
  let pTx: PopulatedTransaction;
  let params: any[];
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    planter = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    fixture = await getMiningFixture();
    visionToken = fixture.visionToken;
    visionFarm = fixture.visionFarm;
    farmersUnion = fixture.farmersUnion;
    voteCounter = fixture.voteCounter;
    const prepare = async (account: SignerWithAddress) => {
      const addr = await account.getAddress();
      await visionToken.mint(addr, parseEther("1000000"));
      await visionToken
        .connect(account)
        .approve(visionFarm.address, parseEther("1000000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
    await visionFarm.connect(alice).stakeAndLock(parseEther("1000"), 40);
    await visionFarm.connect(bob).stakeAndLock(parseEther("100000"), 20);
    await visionFarm.connect(carl).stakeAndLock(parseEther("100"), 4);
    newMemorandom = [
      3600 * 24 * 2,
      3600 * 24 * 7,
      3600 * 24 * 2,
      3600 * 24 * 7,
      parseUnits("100", "gwei"),
      parseUnits("1000", "gwei"),
      voteCounter.address,
    ];
    pTx = await farmersUnion.populateTransaction.changeMemorandom(
      ...newMemorandom
    );
    params = [
      pTx.to,
      pTx.value || 0,
      pTx.data,
      constants.MaxUint256,
      0,
      3600 * 24,
      3600 * 24 * 7,
    ];
  });
  describe("launch()", async () => {
    it("should be launched after 4 weeks", async () => {
      await expect(farmersUnion.launch()).to.be.revertedWith(
        "Wait a bit please."
      );
      await goTo(3600 * 24 * 7 * 4);
      await ethers.provider.send("evm_mine", []);
      await expect(farmersUnion.launch()).not.to.be.reverted;
      expect(await farmersUnion.callStatic.paused()).to.be.false;
    });
    it("should not accept any tx before it's launched", async () => {
      await expect(
        farmersUnion.connect(alice).proposeTx(...params)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
  describe("proposeTx()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.launch();
    });
    it("should propose a new tx and start voting", async () => {
      const txHash = await farmersUnion.callStatic.hashTransaction(
        ...params.slice(0, 5)
      );
      await expect(farmersUnion.connect(alice).proposeTx(...params))
        .to.emit(farmersUnion, "NewProposal")
        .withArgs(0, txHash, false);
    });
    it("should revert when the proposer does not have enough voting power", async () => {
      await expect(
        farmersUnion.connect(carl).proposeTx(...params)
      ).to.be.revertedWith("Not enough votes for proposing.");
    });
    it("should revert when the pending period is too short", async () => {
      await expect(
        farmersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 23, 3600 * 24 * 7)
      ).to.be.revertedWith("Pending period is too short.");
    });
    it("should revert when the pending period is too long", async () => {
      await expect(
        farmersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 24 * 8, 3600 * 24 * 7)
      ).to.be.revertedWith("Pending period is too long.");
    });
    it("should revert when the voting period is too short", async () => {
      await expect(
        farmersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 24 * 1, 3600 * 24 * 6)
      ).to.be.revertedWith("Voting period is too short.");
    });
    it("should revert when the voting period is too long", async () => {
      await expect(
        farmersUnion
          .connect(alice)
          .proposeTx(...params.slice(0, 5), 3600 * 24 * 1, 3600 * 24 * 29)
      ).to.be.revertedWith("Voting period is too long.");
    });
  });
  describe("vote()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.launch();
      await farmersUnion.connect(alice).proposeTx(...params);
    });
    it("should revert during the pending period", async () => {
      await expect(
        farmersUnion.connect(alice).vote(0, true)
      ).to.be.revertedWith("Not in the voting period");
    });
    it("should revert after the voting period", async () => {
      await goTo(3600 * 24 * 7 * 5);
      await ethers.provider.send("evm_mine", []);
      await expect(
        farmersUnion.connect(alice).vote(0, true)
      ).to.be.revertedWith("Not in the voting period");
    });
    it("should vote and increase the for vote", async () => {
      await goTo(3600 * 24 * 2);
      await ethers.provider.send("evm_mine", []);
      await expect(farmersUnion.connect(alice).vote(0, true))
        .to.emit(farmersUnion, "Vote")
        .withArgs(0, alice.address, true);
    });
    it("should not be double-voteable", async () => {
      await goTo(3600 * 24 * 2);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.connect(alice).vote(0, true);

      const forVotes0 = (await farmersUnion.callStatic.proposals(0))
        .totalForVotes;
      await farmersUnion.connect(alice).vote(0, true);
      const forVotes1 = (await farmersUnion.callStatic.proposals(0))
        .totalForVotes;
      const againstVotes1 = (await farmersUnion.callStatic.proposals(0))
        .totalAgainstVotes;
      expect(forVotes0).eq(forVotes1);
      await farmersUnion.connect(alice).vote(0, false);
      const forVotes2 = (await farmersUnion.callStatic.proposals(0))
        .totalForVotes;
      const againstVotes2 = (await farmersUnion.callStatic.proposals(0))
        .totalAgainstVotes;
      expect(forVotes1.sub(forVotes2)).eq(againstVotes2.sub(againstVotes1));
    });
  });
  describe("execute()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.launch();
      await farmersUnion.connect(alice).proposeTx(...params);
      await goTo(3600 * 24 * 2);
      await ethers.provider.send("evm_mine", []);
    });
    it("should be executed when it's total for votes is greater than the minimum", async () => {
      const txHash = await farmersUnion.callStatic.hashTransaction(
        ...params.slice(0, 5)
      );
      await farmersUnion.connect(bob).vote(0, true);
      await goTo(3600 * 24 * 7);
      await ethers.provider.send("evm_mine", []);
      await expect(farmersUnion.execute(0, ...params.slice(0, 5)))
        .to.emit(farmersUnion, "ProposalExecuted")
        .withArgs(0, txHash);
    });
    it("should not execute the tx when its for vote is less than the minimum", async () => {
      await farmersUnion.connect(alice).vote(0, true);
      await goTo(3600 * 24 * 7);
      await ethers.provider.send("evm_mine", []);
      await expect(
        farmersUnion.execute(0, ...params.slice(0, 5))
      ).to.be.revertedWith("vote is not passed");
    });
    it("should not execute the tx when it's total against votes is greater than for votes", async () => {
      await farmersUnion.connect(alice).vote(0, true);
      await farmersUnion.connect(bob).vote(0, false);
      await goTo(3600 * 24 * 7);
      await ethers.provider.send("evm_mine", []);
      await expect(
        farmersUnion.execute(0, ...params.slice(0, 5))
      ).to.be.revertedWith("vote is not passed");
    });
  });
  describe("changeMemorandom()", async () => {
    beforeEach(async () => {
      await goTo(3600 * 24 * 7 * 4);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.launch();
      await farmersUnion.connect(alice).proposeTx(...params);
      await goTo(3600 * 24 * 2);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.connect(bob).vote(0, true);
      await goTo(3600 * 24 * 7);
      await ethers.provider.send("evm_mine", []);
    });
    it("should update the memorandom", async () => {
      await farmersUnion.execute(0, ...params.slice(0, 5));
      const newMemorandom = await farmersUnion.callStatic.memorandom();
      expect(newMemorandom.minimumPending).eq(newMemorandom[0]);
      expect(newMemorandom.maximumPending).eq(newMemorandom[1]);
      expect(newMemorandom.minimumVotingPeriod).eq(newMemorandom[2]);
      expect(newMemorandom.maximumVotingPeriod).eq(newMemorandom[3]);
      expect(newMemorandom.minimumVotesForProposing).eq(newMemorandom[4]);
      expect(newMemorandom.minimumVotes).eq(newMemorandom[5]);
    });
  });
  describe("proposeBatchTx() & executeBatchTx", async () => {
    let batchTxParams: any[];
    beforeEach(async () => {
      batchTxParams = [
        Array(3).fill(params[0]),
        Array(3).fill(params[1]),
        Array(3).fill(params[2]),
        constants.MaxUint256,
        0,
        3600 * 24,
        3600 * 24 * 7,
      ];
      await goTo(3600 * 24 * 7 * 4);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.launch();
      await farmersUnion.connect(alice).proposeBatchTx(...batchTxParams);
      await goTo(3600 * 24 * 2);
      await ethers.provider.send("evm_mine", []);
      await farmersUnion.connect(bob).vote(0, true);
      await goTo(3600 * 24 * 7);
      await ethers.provider.send("evm_mine", []);
    });
    it("should update the memorandom correctly", async () => {
      await farmersUnion.executeBatch(0, ...batchTxParams.slice(0, 5));
      const newMemorandom = await farmersUnion.callStatic.memorandom();
      expect(newMemorandom.minimumPending).eq(newMemorandom[0]);
      expect(newMemorandom.maximumPending).eq(newMemorandom[1]);
      expect(newMemorandom.minimumVotingPeriod).eq(newMemorandom[2]);
      expect(newMemorandom.maximumVotingPeriod).eq(newMemorandom[3]);
      expect(newMemorandom.minimumVotesForProposing).eq(newMemorandom[4]);
      expect(newMemorandom.minimumVotes).eq(newMemorandom[5]);
    });
  });
});
