import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer } from "ethers";
import { defaultAbiCoder, keccak256, parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../utils/utilities";
import { getAppFixture, AppFixture } from "../../scripts/fixtures";

chai.use(solidity);

describe("DealManager.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manager: SignerWithAddress;
  let projContractor: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let dealManager: Contract;
  let laborMarket: Contract;
  let commitmentToken: Contract;
  let stableCoin: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  let deal: {
    projId: string;
    description: string;
    contractor: string;
  };
  let budget: {
    currency: string;
    amount: BigNumber;
  };
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manager = signers[1];
    projContractor = signers[2];
    bob = signers[3];
    fixture = await getAppFixture();
    stableCoin = fixture.stableCoin;
    dealManager = fixture.dealManager;
    commitmentToken = fixture.commitmentToken;
    laborMarket = fixture.laborMarket;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    await stableCoin.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await stableCoin.mint(addr, parseEther("10000"));
      await stableCoin
        .connect(account)
        .approve(dealManager.address, parseEther("10000"));
    };
    await prepare(projContractor);
    await prepare(bob);
    await runTimelockTx(
      timelock,
      dealManager.populateTransaction.setManager(manager.address, true)
    );
    const description = "helloworld";
    const projId = keccak256(
      defaultAbiCoder.encode(
        ["address", "string"],
        [projContractor.address, description]
      )
    );
    deal = { description, contractor: projContractor.address, projId };
    budget = { currency: stableCoin.address, amount: parseEther("100") };
  });
  describe("createDeal()", async () => {
    it("should emit DealCreated() event", async () => {
      await expect(
        dealManager.connect(projContractor).createDeal(deal.description)
      )
        .to.emit(dealManager, "DealCreated")
        .withArgs(deal.projId, deal.contractor, deal.description);
    });
  });
  describe("createDealWithBudget()", async () => {
    it("should transfer the fund from the proposer to the contract", async () => {
      expect(
        await stableCoin.callStatic.balanceOf(projContractor.address)
      ).to.eq(parseEther("10000"));
      expect(await stableCoin.callStatic.balanceOf(dealManager.address)).to.eq(
        parseEther("0")
      );
      await dealManager
        .connect(projContractor)
        .createDealWithBudget(deal.description, budget.currency, budget.amount);
      expect(
        await stableCoin.callStatic.balanceOf(projContractor.address)
      ).to.eq(parseEther("9900"));
      expect(await stableCoin.callStatic.balanceOf(dealManager.address)).to.eq(
        parseEther("100")
      );
    });
  });
  describe("withdrawlDeal() & breakDeal()", async () => {
    beforeEach(async () => {
      await dealManager
        .connect(projContractor)
        .createDealWithBudget(deal.description, budget.currency, budget.amount);
    });
    it("only the proposer can withdraw the deal", async () => {
      await expect(
        dealManager.connect(bob).withdrawDeal(deal.projId)
      ).to.be.revertedWith("Not authorized");
      await expect(
        dealManager.connect(projContractor).withdrawDeal(deal.projId)
      )
        .to.emit(dealManager, "DealWithdrawn")
        .withArgs(deal.projId);
    });
    it("should be withdrawable by the governance too", async () => {
      await expect(
        runTimelockTx(
          timelock,
          dealManager.populateTransaction.breakDeal(deal.projId)
        )
      )
        .to.emit(dealManager, "DealWithdrawn")
        .withArgs(deal.projId);
    });
    it("should refund the unapproved budgets", async () => {
      const bal0: BigNumber = await stableCoin.callStatic.balanceOf(
        projContractor.address
      );
      await dealManager.connect(projContractor).withdrawDeal(deal.projId);
      const bal1: BigNumber = await stableCoin.callStatic.balanceOf(
        projContractor.address
      );
      expect(bal1.sub(bal0)).eq(parseEther("100"));
    });
  });
  describe("approveBudget()", async () => {
    beforeEach(async () => {
      await dealManager
        .connect(projContractor)
        .createDealWithBudget(deal.description, budget.currency, budget.amount);
    });
    it("should be run after the deal is hammered out by the governance", async () => {
      await expect(
        dealManager.connect(manager).approveBudget(deal.projId, 0, [])
      ).to.be.revertedWith("Deal is not hammered out yet.");
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      await expect(
        dealManager.connect(manager).approveBudget(deal.projId, 0, [])
      ).not.to.reverted;
    });
    it("should emit BudgetApproved()", async () => {
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      await expect(
        dealManager.connect(manager).approveBudget(deal.projId, 0, [])
      )
        .to.emit(dealManager, "BudgetApproved")
        .withArgs(deal.projId, 0);
    });
    it("should send the 80% of the fund to the labor market and mint commitment token", async () => {
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await dealManager.connect(manager).approveBudget(deal.projId, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(await stableCoin.callStatic.balanceOf(laborMarket.address)).to.eq(
        parseEther("80")
      );
      expect(await dealManager.callStatic.taxations(stableCoin.address)).eq(
        parseEther("20")
      );
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("80"));
    });
  });
  describe("forceApproveBudget()", async () => {
    beforeEach(async () => {
      await dealManager
        .connect(projContractor)
        .createDealWithBudget(deal.description, budget.currency, budget.amount);
    });
    it("should be run after the deal is hammered out by the governance", async () => {
      await expect(
        dealManager
          .connect(projContractor)
          .forceApproveBudget(deal.projId, 0, [])
      ).to.be.revertedWith("Deal is not hammered out yet.");
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      await expect(
        dealManager
          .connect(projContractor)
          .forceApproveBudget(deal.projId, 0, [])
      ).not.to.be.reverted;
    });
    it("should be run only by the contractor", async () => {
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      await expect(
        dealManager.connect(manager).forceApproveBudget(deal.projId, 0, [])
      ).to.be.revertedWith("Not authorized");
      await expect(
        dealManager
          .connect(projContractor)
          .forceApproveBudget(deal.projId, 0, [])
      ).not.to.be.reverted;
    });
    it("should emit BudgetApproved()", async () => {
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      await expect(
        dealManager
          .connect(projContractor)
          .forceApproveBudget(deal.projId, 0, [])
      )
        .to.emit(dealManager, "BudgetApproved")
        .withArgs(deal.projId, 0);
    });
    it("should take 50% of the fund for the fee.", async () => {
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      const prevTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      await dealManager
        .connect(projContractor)
        .forceApproveBudget(deal.projId, 0, []);
      const updatedTotalSupply: BigNumber = await commitmentToken.callStatic.totalSupply();
      expect(await stableCoin.callStatic.balanceOf(laborMarket.address)).to.eq(
        parseEther("50")
      );
      expect(await dealManager.callStatic.taxations(stableCoin.address)).eq(
        parseEther("50")
      );
      expect(updatedTotalSupply.sub(prevTotalSupply)).eq(parseEther("50"));
    });
  });
  describe("addBudget(): should allow contractors add new budgets and manager can approve them without governance approval", async () => {
    beforeEach(async () => {
      await dealManager
        .connect(projContractor)
        .createDealWithBudget(deal.description, budget.currency, budget.amount);
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
    });
    it("should be run only by the proj contractor", async () => {
      await expect(
        dealManager
          .connect(bob)
          .addBudget(deal.projId, stableCoin.address, parseEther("10"))
      ).to.be.revertedWith("Not authorized");
      await expect(
        dealManager
          .connect(projContractor)
          .addBudget(deal.projId, stableCoin.address, parseEther("10"))
      )
        .to.emit(dealManager, "BudgetAdded")
        .withArgs(deal.projId, 1, stableCoin.address, parseEther("10"));
    });
  });
  describe("taxToVisionFarm()", async () => {
    beforeEach(async () => {
      await dealManager
        .connect(projContractor)
        .createDealWithBudget(deal.description, budget.currency, budget.amount);
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.hammerOut(deal.projId)
      );
      await dealManager.connect(manager).approveBudget(deal.projId, 0, []);
    });
    it("should pass the taxations to the vision farm", async () => {
      await runTimelockTx(
        timelock,
        dealManager.populateTransaction.taxToVisionFarm(
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
