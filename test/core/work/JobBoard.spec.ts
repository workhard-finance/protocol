import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer, BigNumberish } from "ethers";
import {
  keccak256,
  parseEther,
  solidityKeccak256,
  solidityPack,
} from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../../utils/utilities";
import { getAppFixture, AppFixture } from "../../../scripts/fixtures";

chai.use(solidity);

describe("JobBoard.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let jobBoard: Contract;
  let stableReserve: Contract;
  let commitmentToken: Contract;
  let projectToken: Contract;
  let baseCurrency: Contract;
  let dividendPool: Contract;
  let timelock: Contract;
  let project: {
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
    commitmentToken = fixture.commitmentToken;
    stableReserve = fixture.stableReserve;
    projectToken = fixture.projectToken;
    dividendPool = fixture.dividendPool;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseCurrency.mint(addr, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(jobBoard.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await commitmentToken
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(bob);
    const uri = "ipfs://MY_PROJECT_URL";
    project = {
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
      await expect(jobBoard.connect(projOwner).createProject(project.uri))
        .to.emit(jobBoard, "ProjectPosted")
        .withArgs(project.id);
    });
  });
  describe("addBudget()", async () => {
    it("should transfer the fund from the proposer to the contract", async () => {
      await jobBoard.connect(projOwner).createProject(project.uri);
      expect(await baseCurrency.callStatic.balanceOf(projOwner.address)).to.eq(
        parseEther("10000")
      );
      expect(await baseCurrency.callStatic.balanceOf(jobBoard.address)).to.eq(
        parseEther("0")
      );
      await jobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
      expect(await baseCurrency.callStatic.balanceOf(projOwner.address)).to.eq(
        parseEther("9900")
      );
      expect(await baseCurrency.callStatic.balanceOf(jobBoard.address)).to.eq(
        parseEther("100")
      );
    });
  });
  describe("closeProject() & disapproveProject()", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(project.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("only the proposer can close the project", async () => {
      await expect(
        jobBoard.connect(bob).closeProject(project.id)
      ).to.be.revertedWith("Not authorized");
      await expect(jobBoard.connect(projOwner).closeProject(project.id))
        .to.emit(jobBoard, "ProjectClosed")
        .withArgs(project.id);
    });
    it("should be withdrawable by the governance too", async () => {
      await expect(
        jobBoard.connect(bob).closeProject(project.id)
      ).to.be.revertedWith("Not authorized");
      await expect(
        runTimelockTx(
          timelock,
          jobBoard.populateTransaction.disapproveProject(project.id)
        )
      )
        .to.emit(jobBoard, "ProjectClosed")
        .withArgs(project.id);
    });
    it("should refund the unapproved budgets", async () => {
      const bal0: BigNumber = await baseCurrency.callStatic.balanceOf(
        projOwner.address
      );
      await jobBoard.connect(projOwner).closeProject(project.id);
      const bal1: BigNumber = await baseCurrency.callStatic.balanceOf(
        projOwner.address
      );
      expect(bal1.sub(bal0)).eq(parseEther("100"));
    });
  });
  describe("executeBudget()", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(project.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        jobBoard.connect(projOwner).executeBudget(project.id, 0, [])
      ).to.be.revertedWith("Not an approved project.");
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(project.id)
      );
      await expect(jobBoard.connect(projOwner).executeBudget(project.id, 0, []))
        .not.to.reverted;
    });
    it("should emit BudgetExecuted()", async () => {
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(project.id)
      );
      await expect(jobBoard.connect(projOwner).executeBudget(project.id, 0, []))
        .to.emit(jobBoard, "BudgetExecuted")
        .withArgs(project.id, 0);
    });
    it("should send the 80% of the fund to the labor market and mint commitment token", async () => {
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(project.id)
      );
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await jobBoard.connect(projOwner).executeBudget(project.id, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(
        await baseCurrency.callStatic.balanceOf(stableReserve.address)
      ).to.eq(parseEther("80"));
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("80"));
    });
    it("should send the 20% of the fund to the vision farm", async () => {
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(project.id)
      );
      await jobBoard.connect(projOwner).executeBudget(project.id, 0, []);
      const currentEpoch = await dividendPool.callStatic.getCurrentEpoch();
      const result = await dividendPool.callStatic.getClaimableCrops(
        currentEpoch + 1
      );
      expect(result.tokens).to.deep.eq([baseCurrency.address]);
      expect(result.amounts).to.deep.eq([parseEther("20")]);
    });
  });
  describe("forceExecuteBudget()", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(project.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        jobBoard.connect(projOwner).forceExecuteBudget(project.id, 0)
      ).not.to.be.reverted;
    });
    it("should be run only by the project owner", async () => {
      await expect(
        jobBoard.connect(alice).forceExecuteBudget(project.id, 0)
      ).to.be.revertedWith("Not authorized");
      await expect(
        jobBoard.connect(projOwner).forceExecuteBudget(project.id, 0)
      ).not.to.be.reverted;
    });
    it("should emit BudgetExecuted()", async () => {
      await expect(
        jobBoard.connect(projOwner).forceExecuteBudget(project.id, 0)
      )
        .to.emit(jobBoard, "BudgetExecuted")
        .withArgs(project.id, 0);
    });
    it("should take 50% of the fund for the fee.", async () => {
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await jobBoard.connect(projOwner).forceExecuteBudget(project.id, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(
        await baseCurrency.callStatic.balanceOf(stableReserve.address)
      ).to.eq(parseEther("50"));
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("50"));
      const currentEpoch = await dividendPool.callStatic.getCurrentEpoch();
      const result = await dividendPool.callStatic.getClaimableCrops(
        currentEpoch + 1
      );
      expect(result.tokens).to.deep.eq([baseCurrency.address]);
      expect(result.amounts).to.deep.eq([parseEther("50")]);
    });
  });
  describe("addBudget(): should allow project owners add new budgets and governance approves them", async () => {
    beforeEach(async () => {
      await jobBoard.connect(projOwner).createProject(project.uri);
      await jobBoard
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
      await runTimelockTx(
        timelock,
        jobBoard.populateTransaction.approveProject(project.id)
      );
    });
    it("should be run only by the project owner", async () => {
      await expect(
        jobBoard
          .connect(bob)
          .addBudget(project.id, budget.currency, budget.amount)
      ).to.be.revertedWith("Not authorized");
      await expect(
        jobBoard
          .connect(projOwner)
          .addBudget(project.id, budget.currency, budget.amount)
      )
        .to.emit(jobBoard, "BudgetAdded")
        .withArgs(project.id, 1, baseCurrency.address, parseEther("100"));
    });
    describe("compensate()", async () => {
      beforeEach(async () => {
        await jobBoard
          .connect(projOwner)
          .addBudget(project.id, budget.currency, budget.amount);
        await jobBoard.connect(projOwner).forceExecuteBudget(project.id, 0);
      });
      it("the budget owner can execute the budget", async () => {
        const bal0: BigNumber = await commitmentToken.callStatic.balanceOf(
          alice.address
        );
        await expect(
          jobBoard
            .connect(projOwner)
            .compensate(project.id, alice.address, parseEther("1"))
        )
          .to.emit(jobBoard, "Payed")
          .withArgs(project.id, alice.address, parseEther("1"));
        const bal1: BigNumber = await commitmentToken.callStatic.balanceOf(
          alice.address
        );
        expect(bal1.sub(bal0)).eq(parseEther("1"));
      });
    });
  });
});
