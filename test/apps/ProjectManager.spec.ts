import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer } from "ethers";
import { defaultAbiCoder, keccak256, parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../utils/utilities";
import { getAppFixture, AppFixture } from "../../scripts/fixtures";

chai.use(solidity);

describe("ProjectManager.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manager: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let projManager: Contract;
  let cryptoJobBoard: Contract;
  let commitmentToken: Contract;
  let projectToken: Contract;
  let stableCoin: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  let project: {
    id: number;
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
    manager = signers[1];
    projOwner = signers[2];
    bob = signers[3];
    fixture = await getAppFixture();
    stableCoin = fixture.stableCoin;
    projManager = fixture.projManager;
    commitmentToken = fixture.commitmentToken;
    cryptoJobBoard = fixture.cryptoJobBoard;
    projectToken = fixture.projectToken;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    await stableCoin.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await stableCoin.mint(addr, parseEther("10000"));
      await stableCoin
        .connect(account)
        .approve(projManager.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(bob);
    await runTimelockTx(
      timelock,
      projManager.populateTransaction.setManager(manager.address, true)
    );
    project = {
      id: 0,
      description: "helloworld",
      uri: "ipfs://MY_PROJECT_URL",
    };
    budget = { currency: stableCoin.address, amount: parseEther("100") };
  });
  describe("createProject()", async () => {
    it("should emit ProjectPosted() event", async () => {
      const expectedId = 0;
      await expect(
        projManager
          .connect(projOwner)
          .createProject(project.description, project.uri)
      )
        .to.emit(projManager, "ProjectPosted")
        .withArgs(expectedId);
    });
  });
  describe("addBudget()", async () => {
    it("should transfer the fund from the proposer to the contract", async () => {
      await projManager
        .connect(projOwner)
        .createProject(project.description, project.uri);
      expect(await stableCoin.callStatic.balanceOf(projOwner.address)).to.eq(
        parseEther("10000")
      );
      expect(await stableCoin.callStatic.balanceOf(projManager.address)).to.eq(
        parseEther("0")
      );
      await projManager
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
      expect(await stableCoin.callStatic.balanceOf(projOwner.address)).to.eq(
        parseEther("9900")
      );
      expect(await stableCoin.callStatic.balanceOf(projManager.address)).to.eq(
        parseEther("100")
      );
    });
  });
  describe("closeProject() & disapproveProject()", async () => {
    beforeEach(async () => {
      await projManager
        .connect(projOwner)
        .createProject(project.description, project.uri);
      await projManager
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("only the proposer can close the project", async () => {
      await expect(
        projManager.connect(bob).closeProject(project.id)
      ).to.be.revertedWith("Not authorized");
      await expect(projManager.connect(projOwner).closeProject(project.id))
        .to.emit(projManager, "ProjectClosed")
        .withArgs(project.id);
    });
    it("should be withdrawable by the governance too", async () => {
      await expect(
        projManager.connect(bob).closeProject(project.id)
      ).to.be.revertedWith("Not authorized");
      await expect(
        runTimelockTx(
          timelock,
          projManager.populateTransaction.disapproveProject(project.id)
        )
      )
        .to.emit(projManager, "ProjectClosed")
        .withArgs(project.id);
    });
    it("should refund the unapproved budgets", async () => {
      const bal0: BigNumber = await stableCoin.callStatic.balanceOf(
        projOwner.address
      );
      await projManager.connect(projOwner).closeProject(project.id);
      const bal1: BigNumber = await stableCoin.callStatic.balanceOf(
        projOwner.address
      );
      expect(bal1.sub(bal0)).eq(parseEther("100"));
    });
  });
  describe("approveBudget()", async () => {
    beforeEach(async () => {
      await projManager
        .connect(projOwner)
        .createProject(project.description, project.uri);
      await projManager
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        projManager.connect(manager).approveBudget(project.id, 0, [])
      ).to.be.revertedWith("Not an approved project.");
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      await expect(
        projManager.connect(manager).approveBudget(project.id, 0, [])
      ).not.to.reverted;
    });
    it("should emit BudgetApproved()", async () => {
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      await expect(
        projManager.connect(manager).approveBudget(project.id, 0, [])
      )
        .to.emit(projManager, "BudgetApproved")
        .withArgs(project.id, 0);
    });
    it("should send the 80% of the fund to the labor market and mint commitment token", async () => {
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await projManager.connect(manager).approveBudget(project.id, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(await stableCoin.callStatic.balanceOf(cryptoJobBoard.address)).to.eq(
        parseEther("80")
      );
      expect(await projManager.callStatic.taxations(stableCoin.address)).eq(
        parseEther("20")
      );
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("80"));
    });
  });
  describe("forceApproveBudget()", async () => {
    beforeEach(async () => {
      await projManager
        .connect(projOwner)
        .createProject(project.description, project.uri);
      await projManager
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
    });
    it("should be run after the project is approved by the governance", async () => {
      await expect(
        projManager.connect(projOwner).forceApproveBudget(project.id, 0)
      ).to.be.revertedWith("Not an approved project.");
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      await expect(
        projManager.connect(projOwner).forceApproveBudget(project.id, 0)
      ).not.to.be.reverted;
    });
    it("should be run only by the project owner", async () => {
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      await expect(
        projManager.connect(manager).forceApproveBudget(project.id, 0)
      ).to.be.revertedWith("Not authorized");
      await expect(
        projManager.connect(projOwner).forceApproveBudget(project.id, 0)
      ).not.to.be.reverted;
    });
    it("should emit BudgetApproved()", async () => {
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      await expect(
        projManager.connect(projOwner).forceApproveBudget(project.id, 0)
      )
        .to.emit(projManager, "BudgetApproved")
        .withArgs(project.id, 0);
    });
    it("should take 50% of the fund for the fee.", async () => {
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await projManager
        .connect(projOwner)
        .forceApproveBudget(project.id, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(await stableCoin.callStatic.balanceOf(cryptoJobBoard.address)).to.eq(
        parseEther("50")
      );
      expect(await projManager.callStatic.taxations(stableCoin.address)).eq(
        parseEther("50")
      );
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("50"));
    });
  });
  describe("addBudget(): should allow project owners add new budgets and manager can approve them without governance approval", async () => {
    beforeEach(async () => {
      await projManager
        .connect(projOwner)
        .createProject(project.description, project.uri);
      await projManager
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
    });
    it("should be run only by the project owner", async () => {
      await expect(
        projManager
          .connect(bob)
          .addBudget(project.id, budget.currency, budget.amount)
      ).to.be.revertedWith("Not authorized");
      await expect(
        projManager
          .connect(projOwner)
          .addBudget(project.id, budget.currency, budget.amount)
      )
        .to.emit(projManager, "BudgetAdded")
        .withArgs(project.id, 1, stableCoin.address, parseEther("100"));
    });
  });
  describe("taxToVisionFarm()", async () => {
    beforeEach(async () => {
      await projManager
        .connect(projOwner)
        .createProject(project.description, project.uri);
      await projManager
        .connect(projOwner)
        .addBudget(project.id, budget.currency, budget.amount);
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.approveProject(project.id)
      );
      await projManager.connect(manager).approveBudget(project.id, 0, []);
    });
    it("should pass the taxations to the vision farm", async () => {
      await runTimelockTx(
        timelock,
        projManager.populateTransaction.taxToVisionFarm(
          stableCoin.address,
          parseEther("20")
        )
      );
      const currentEpoch = await visionFarm.callStatic.getCurrentEpoch();
      const result = await visionFarm.callStatic.getHarvestableCrops(
        currentEpoch + 1
      );
      expect(result.tokens).to.deep.eq([stableCoin.address]);
      expect(result.amounts).to.deep.eq([parseEther("20")]);
    });
  });
});
