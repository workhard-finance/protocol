import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../utils/utilities";
import { getAppFixture, AppFixture } from "../../scripts/fixtures";

chai.use(solidity);

describe("CryptoJobBoard.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let cryptoJobBoard: Contract;
  let stableReserves: Contract;
  let commitmentToken: Contract;
  let projectToken: Contract;
  let baseCurrency: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  let project: {
    id: number;
    title: string;
    description: string;
    uri: string;
  };
  let budget: {
    currency: string;
    amount: BigNumber;
  };
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    projOwner = signers[1];
    alice = signers[2];
    bob = signers[3];
    fixture = await getAppFixture();
    baseCurrency = fixture.baseCurrency;
    cryptoJobBoard = fixture.cryptoJobBoard;
    commitmentToken = fixture.commitmentToken;
    stableReserves = fixture.stableReserves;
    projectToken = fixture.projectToken;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseCurrency.mint(addr, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(cryptoJobBoard.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserves.address, parseEther("10000"));
      await commitmentToken
        .connect(account)
        .approve(stableReserves.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(bob);
    project = {
      id: 0,
      title: "Workhard is hiring",
      description: "helloworld",
      uri: "ipfs://MY_PROJECT_URL",
    };
    budget = { currency: baseCurrency.address, amount: parseEther("100") };
  });
  describe("createProject()", async () => {
    it("should emit ProjectPosted() event", async () => {
      const expectedId = 0;
      await expect(cryptoJobBoard.connect(projOwner).createProject(project.uri))
        .to.emit(cryptoJobBoard, "ProjectPosted")
        .withArgs(expectedId);
    });
  });
  describe("addBudget()", async () => {
    it("should transfer the fund from the proposer to the contract", async () => {
      await cryptoJobBoard.connect(projOwner).createProject(project.uri);
      expect(await baseCurrency.callStatic.balanceOf(projOwner.address)).to.eq(
        parseEther("10000")
      );
      expect(
        await baseCurrency.callStatic.balanceOf(cryptoJobBoard.address)
      ).to.eq(parseEther("0"));
      await cryptoJobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
      expect(await baseCurrency.callStatic.balanceOf(projOwner.address)).to.eq(
        parseEther("9900")
      );
      expect(
        await baseCurrency.callStatic.balanceOf(cryptoJobBoard.address)
      ).to.eq(parseEther("100"));
    });
  });
  describe("closeProject() & disapproveProject()", async () => {
    beforeEach(async () => {
      await cryptoJobBoard.connect(projOwner).createProject(project.uri);
      await cryptoJobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("only the proposer can close the project", async () => {
      await expect(
        cryptoJobBoard.connect(bob).closeProject(project.id)
      ).to.be.revertedWith("Not authorized");
      await expect(cryptoJobBoard.connect(projOwner).closeProject(project.id))
        .to.emit(cryptoJobBoard, "ProjectClosed")
        .withArgs(project.id);
    });
    it("should be withdrawable by the governance too", async () => {
      await expect(
        cryptoJobBoard.connect(bob).closeProject(project.id)
      ).to.be.revertedWith("Not authorized");
      await expect(
        runTimelockTx(
          timelock,
          cryptoJobBoard.populateTransaction.disapproveProject(project.id)
        )
      )
        .to.emit(cryptoJobBoard, "ProjectClosed")
        .withArgs(project.id);
    });
    it("should refund the unapproved budgets", async () => {
      const bal0: BigNumber = await baseCurrency.callStatic.balanceOf(
        projOwner.address
      );
      await cryptoJobBoard.connect(projOwner).closeProject(project.id);
      const bal1: BigNumber = await baseCurrency.callStatic.balanceOf(
        projOwner.address
      );
      expect(bal1.sub(bal0)).eq(parseEther("100"));
    });
  });
  describe("executeBudget()", async () => {
    beforeEach(async () => {
      await cryptoJobBoard.connect(projOwner).createProject(project.uri);
      await cryptoJobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        cryptoJobBoard.connect(projOwner).executeBudget(project.id, 0, [])
      ).to.be.revertedWith("Not an approved project.");
      await runTimelockTx(
        timelock,
        cryptoJobBoard.populateTransaction.approveProject(project.id)
      );
      await expect(
        cryptoJobBoard.connect(projOwner).executeBudget(project.id, 0, [])
      ).not.to.reverted;
    });
    it("should emit BudgetExecuted()", async () => {
      await runTimelockTx(
        timelock,
        cryptoJobBoard.populateTransaction.approveProject(project.id)
      );
      await expect(
        cryptoJobBoard.connect(projOwner).executeBudget(project.id, 0, [])
      )
        .to.emit(cryptoJobBoard, "BudgetExecuted")
        .withArgs(project.id, 0);
    });
    it("should send the 80% of the fund to the labor market and mint commitment token", async () => {
      await runTimelockTx(
        timelock,
        cryptoJobBoard.populateTransaction.approveProject(project.id)
      );
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await cryptoJobBoard.connect(projOwner).executeBudget(project.id, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(
        await baseCurrency.callStatic.balanceOf(stableReserves.address)
      ).to.eq(parseEther("80"));
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("80"));
    });
    it("should send the 20% of the fund to the vision farm", async () => {
      await runTimelockTx(
        timelock,
        cryptoJobBoard.populateTransaction.approveProject(project.id)
      );
      await cryptoJobBoard.connect(projOwner).executeBudget(project.id, 0, []);
      const currentEpoch = await visionFarm.callStatic.getCurrentEpoch();
      const result = await visionFarm.callStatic.getHarvestableCrops(
        currentEpoch + 1
      );
      expect(result.tokens).to.deep.eq([baseCurrency.address]);
      expect(result.amounts).to.deep.eq([parseEther("20")]);
    });
  });
  describe("forceExecuteBudget()", async () => {
    beforeEach(async () => {
      await cryptoJobBoard.connect(projOwner).createProject(project.uri);
      await cryptoJobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        cryptoJobBoard.connect(projOwner).forceExecuteBudget(project.id, 0)
      ).not.to.be.reverted;
    });
    it("should be run only by the project owner", async () => {
      await expect(
        cryptoJobBoard.connect(alice).forceExecuteBudget(project.id, 0)
      ).to.be.revertedWith("Not authorized");
      await expect(
        cryptoJobBoard.connect(projOwner).forceExecuteBudget(project.id, 0)
      ).not.to.be.reverted;
    });
    it("should emit BudgetExecuted()", async () => {
      await expect(
        cryptoJobBoard.connect(projOwner).forceExecuteBudget(project.id, 0)
      )
        .to.emit(cryptoJobBoard, "BudgetExecuted")
        .withArgs(project.id, 0);
    });
    it("should take 50% of the fund for the fee.", async () => {
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await cryptoJobBoard
        .connect(projOwner)
        .forceExecuteBudget(project.id, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(
        await baseCurrency.callStatic.balanceOf(stableReserves.address)
      ).to.eq(parseEther("50"));
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("50"));
      const currentEpoch = await visionFarm.callStatic.getCurrentEpoch();
      const result = await visionFarm.callStatic.getHarvestableCrops(
        currentEpoch + 1
      );
      expect(result.tokens).to.deep.eq([baseCurrency.address]);
      expect(result.amounts).to.deep.eq([parseEther("50")]);
    });
  });
  describe("addBudget(): should allow project owners add new budgets and governance approves them", async () => {
    beforeEach(async () => {
      await cryptoJobBoard.connect(projOwner).createProject(project.uri);
      await cryptoJobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
      await runTimelockTx(
        timelock,
        cryptoJobBoard.populateTransaction.approveProject(project.id)
      );
    });
    it("should be run only by the project owner", async () => {
      await expect(
        cryptoJobBoard
          .connect(bob)
          .addBudget(project.id, budget.currency, budget.amount)
      ).to.be.revertedWith("Not authorized");
      await expect(
        cryptoJobBoard
          .connect(projOwner)
          .addBudget(project.id, budget.currency, budget.amount)
      )
        .to.emit(cryptoJobBoard, "BudgetAdded")
        .withArgs(project.id, 1, baseCurrency.address, parseEther("100"));
    });
    describe("compensate()", async () => {
      beforeEach(async () => {
        await cryptoJobBoard.connect(projOwner).createProject(project.uri);
        await cryptoJobBoard
          .connect(projOwner)
          .addBudget(project.id, budget.currency, budget.amount);
        await cryptoJobBoard
          .connect(projOwner)
          .forceExecuteBudget(project.id, 0);
      });
      it("the budget owner can execute the budget", async () => {
        const bal0: BigNumber = await commitmentToken.callStatic.balanceOf(
          alice.address
        );
        await expect(
          cryptoJobBoard
            .connect(projOwner)
            .compensate(project.id, alice.address, parseEther("1"))
        )
          .to.emit(cryptoJobBoard, "Payed")
          .withArgs(project.id, alice.address, parseEther("1"));
        const bal1: BigNumber = await commitmentToken.callStatic.balanceOf(
          alice.address
        );
        expect(bal1.sub(bal0)).eq(parseEther("1"));
      });
    });
  });
});
