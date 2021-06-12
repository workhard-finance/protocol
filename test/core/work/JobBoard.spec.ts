import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, BigNumberish } from "ethers";
import { parseEther, solidityKeccak256 } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../../utils/utilities";
import {
  COMMIT,
  DividendPool,
  ERC20,
  JobBoard,
  Workhard,
  StableReserve,
  TimelockedGovernance,
  WorkhardDAO,
  ERC20__factory,
  JobBoard__factory,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("JobBoard.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let masterDAO: WorkhardDAO;
  let jobBoard: JobBoard;
  let stableReserve: StableReserve;
  let commit: COMMIT;
  let workhard: Workhard;
  let baseCurrency: ERC20;
  let dividendPool: DividendPool;
  let timelock: TimelockedGovernance;
  let projectMetadata: {
    id: BigNumber;
    title: string;
    description: string;
    uri: string;
  };
  let budget: {
    currency: string;
    amount: BigNumber;
  };
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    projOwner = signers[1];
    alice = signers[2];
    bob = signers[3];
    const client = await getWorkhard();
    workhard = client.workhard;
    masterDAO = await client.getMasterDAO({ account: deployer });
    baseCurrency = ERC20__factory.connect(
      masterDAO.baseCurrency.address,
      deployer
    );

    jobBoard = JobBoard__factory.connect(
      (await (await ethers.getContractFactory("JobBoard")).deploy()).address,
      deployer
    );
    await jobBoard[
      "initialize(address,address,address,address,address,address,address)"
    ](
      workhard.address,
      masterDAO.timelock.address,
      masterDAO.dividendPool.address,
      masterDAO.stableReserve.address,
      masterDAO.baseCurrency.address,
      masterDAO.commit.address,
      client.commons.sablier.address
    );
    commit = masterDAO.commit;
    stableReserve = masterDAO.stableReserve;
    dividendPool = masterDAO.dividendPool;
    timelock = masterDAO.timelock;
    await runTimelockTx(
      timelock,
      stableReserve.populateTransaction.allow(jobBoard.address, true)
    );
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
      id: BigNumber.from(1),
      title: "Workhard is hiring",
      description: "helloworld",
      uri,
    };
    budget = { currency: baseCurrency.address, amount: parseEther("100") };
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("createProject()", async () => {
    it("should emit NewProject() event", async () => {
      await expect(
        workhard.connect(projOwner).createProject(0, projectMetadata.uri)
      )
        .to.emit(workhard, "NewProject")
        .withArgs(0, projectMetadata.id);
    });
  });
  describe("addBudget()", async () => {
    it("should transfer the fund from the proposer to the contract", async () => {
      await workhard.connect(projOwner).createProject(0, projectMetadata.uri);
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
      await workhard.connect(projOwner).createProject(0, projectMetadata.uri);
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
      await workhard.connect(projOwner).createProject(0, projectMetadata.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(projectMetadata.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0)
      ).to.be.revertedWith("Not an approved project.");
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(projectMetadata.id)
      );
      await expect(
        jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0)
      ).not.to.reverted;
    });
    it("should emit BudgetExecuted()", async () => {
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(projectMetadata.id)
      );
      await expect(
        jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0)
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
      await jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0);
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
      await jobBoard.connect(projOwner).executeBudget(projectMetadata.id, 0);
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
      await workhard.connect(projOwner).createProject(0, projectMetadata.uri);
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
      await workhard.connect(projOwner).createProject(0, projectMetadata.uri);
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
