import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, BigNumberish } from "ethers";
import { parseEther, solidityKeccak256 } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../../utils/utilities";
import { getAppFixture, AppFixture } from "../../../scripts/fixtures";
import {
  COMMIT,
  DividendPool,
  ERC20Mock,
  JobBoard,
  Project,
  StableReserve,
  TimelockedGovernance,
} from "../../../src";

chai.use(solidity);

describe("JobBoard.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let jobBoard: JobBoard;
  let stableReserve: StableReserve;
  let commit: COMMIT;
  let project: Project;
  let baseCurrency: ERC20Mock;
  let dividendPool: DividendPool;
  let timelock: TimelockedGovernance;
  let projectMetadata: {
    id: BigNumberish;
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
    jobBoard = fixture.jobBoard;
    commit = fixture.commit;
    stableReserve = fixture.stableReserve;
    project = fixture.project;
    dividendPool = fixture.dividendPool;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: SignerWithAddress) => {
      await baseCurrency.mint(account.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(jobBoard.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await commit
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(bob);
    const uri = "ipfs://MY_PROJECT_URL";
    projectMetadata = {
      id: BigNumber.from(
        solidityKeccak256(["string", "address"], [uri, projOwner.address])
      ),
      title: "Workhard is hiring",
      description: "helloworld",
      uri,
    };
    budget = { currency: baseCurrency.address, amount: parseEther("100") };
  });
  describe("createProject()", async () => {
    it("should emit ProjectPosted() event", async () => {
      await expect(
        jobBoard.connect(projOwner).createProject(projectMetadata.uri)
      )
        .to.emit(jobBoard, "ProjectPosted")
        .withArgs(projectMetadata.id);
    });
  });
  describe("addBudget()", async () => {
    it("should transfer the fund from the proposer to the contract", async () => {
      await jobBoard.connect(projOwner).createProject(projectMetadata.uri);
      expect(await baseCurrency.balanceOf(projOwner.address)).to.eq(
        parseEther("10000")
      );
      expect(await baseCurrency.balanceOf(jobBoard.address)).to.eq(
        parseEther("0")
      );
      await jobBoard
        .connect(projOwner)
        .addBudget(projectMetadata.id, budget.currency, budget.amount);
      expect(await baseCurrency.balanceOf(projOwner.address)).to.eq(
        parseEther("9900")
      );
      expect(await baseCurrency.balanceOf(jobBoard.address)).to.eq(
        parseEther("100")
      );
    });
  });
  describe("closeProject() & disapproveProject()", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(projectMetadata.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(projectMetadata.id, budget.currency, budget.amount);
    });
    it("only the proposer can close the project", async () => {
      await expect(
        jobBoard.connect(bob).closeProject(projectMetadata.id)
      ).to.be.revertedWith("Not authorized");
      await expect(jobBoard.connect(projOwner).closeProject(projectMetadata.id))
        .to.emit(jobBoard, "ProjectClosed")
        .withArgs(projectMetadata.id);
    });
    it("should be withdrawable by the governance too", async () => {
      await expect(
        jobBoard.connect(bob).closeProject(projectMetadata.id)
      ).to.be.revertedWith("Not authorized");
      await expect(
        runTimelockTx(
          timelock,
          jobBoard.populateTransaction.disapproveProject(projectMetadata.id)
        )
      )
        .to.emit(jobBoard, "ProjectClosed")
        .withArgs(projectMetadata.id);
    });
    it("should refund the unapproved budgets", async () => {
      const bal0: BigNumber = await baseCurrency.balanceOf(projOwner.address);
      await jobBoard.connect(projOwner).closeProject(projectMetadata.id);
      const bal1: BigNumber = await baseCurrency.balanceOf(projOwner.address);
      expect(bal1.sub(bal0)).eq(parseEther("100"));
    });
  });
  describe("executeBudget()", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(projectMetadata.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(projectMetadata.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0, [])
      ).to.be.revertedWith("Not an approved project.");
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(projectMetadata.id)
      );
      await expect(
        jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0, [])
      ).not.to.reverted;
    });
    it("should emit BudgetExecuted()", async () => {
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(projectMetadata.id)
      );
      await expect(
        jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0, [])
      )
        .to.emit(jobBoard, "BudgetExecuted")
        .withArgs(projectMetadata.id, 0);
    });
    it("should send the 80% of the fund to the labor market and mint commit token", async () => {
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(projectMetadata.id)
      );
      const prevTotalSupply: BigNumber = await commit.totalSupply();
      await jobBoard
        .connect(projOwner)
        .executeBudget(projectMetadata.id, 0, []);
      const updatedTotalSupply: BigNumber = await commit.totalSupply();
      expect(await baseCurrency.balanceOf(stableReserve.address)).to.eq(
        parseEther("80")
      );
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("80"));
    });
    it("should send the 20% of the fund to the vision farm", async () => {
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(projectMetadata.id)
      );
      await jobBoard
        .connect(projOwner)
        .executeBudget(projectMetadata.id, 0, []);
      const weekNum = await dividendPool.getCurrentEpoch();
      const result = await dividendPool.distributionOfWeek(
        baseCurrency.address,
        weekNum
      );
      expect(result).to.eq(parseEther("20"));
    });
  });
  describe("forceExecuteBudget()", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(projectMetadata.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(projectMetadata.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        jobBoard.connect(projOwner).forceExecuteBudget(projectMetadata.id, 0)
      ).not.to.be.reverted;
    });
    it("should be run only by the project owner", async () => {
      await expect(
        jobBoard.connect(alice).forceExecuteBudget(projectMetadata.id, 0)
      ).to.be.revertedWith("Not authorized");
      await expect(
        jobBoard.connect(projOwner).forceExecuteBudget(projectMetadata.id, 0)
      ).not.to.be.reverted;
    });
    it("should emit BudgetExecuted()", async () => {
      await expect(
        jobBoard.connect(projOwner).forceExecuteBudget(projectMetadata.id, 0)
      )
        .to.emit(jobBoard, "BudgetExecuted")
        .withArgs(projectMetadata.id, 0);
    });
    it("should take 50% of the fund for the fee.", async () => {
      const prevTotalSupply: BigNumber = await commit.totalSupply();
      await jobBoard
        .connect(projOwner)
        .forceExecuteBudget(projectMetadata.id, 0);
      const updatedTotalSupply: BigNumber = await commit.totalSupply();
      expect(await baseCurrency.balanceOf(stableReserve.address)).to.eq(
        parseEther("50")
      );
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("50"));
      const weekNum = await dividendPool.getCurrentEpoch();
      const result = await dividendPool.distributionOfWeek(
        baseCurrency.address,
        weekNum
      );
      expect(result).to.eq(parseEther("50"));
    });
  });
  describe("addBudget(): should allow project owners add new budgets and governance approves them", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(projectMetadata.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(projectMetadata.id, budget.currency, budget.amount);
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(projectMetadata.id)
      );
    });
    it("should be run only by the project owner", async () => {
      await expect(
        jobBoard
          .connect(bob)
          .addBudget(projectMetadata.id, budget.currency, budget.amount)
      ).to.be.revertedWith("Not authorized");
      await expect(
        jobBoard
          .connect(projOwner)
          .addBudget(projectMetadata.id, budget.currency, budget.amount)
      )
        .to.emit(jobBoard, "BudgetAdded")
        .withArgs(
          projectMetadata.id,
          1,
          baseCurrency.address,
          parseEther("100")
        );
    });
    describe("compensate()", async () => {
      beforeEach(async () => {
        await jobBoard
          .connect(projOwner)
          .addBudget(projectMetadata.id, budget.currency, budget.amount);
        await jobBoard
          .connect(projOwner)
          .forceExecuteBudget(projectMetadata.id, 0);
      });
      it("the budget owner can execute the budget", async () => {
        const bal0: BigNumber = await commit.balanceOf(alice.address);
        await expect(
          jobBoard
            .connect(projOwner)
            .compensate(projectMetadata.id, alice.address, parseEther("1"))
        )
          .to.emit(jobBoard, "Payed")
          .withArgs(projectMetadata.id, alice.address, parseEther("1"));
        const bal1: BigNumber = await commit.balanceOf(alice.address);
        expect(bal1.sub(bal0)).eq(parseEther("1"));
      });
    });
  });
});
