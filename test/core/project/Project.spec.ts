import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  defaultDAOParam,
  getHelperFixture,
  getWorkhard,
  HelperFixture,
} from "../../../scripts/fixtures";
import { DAO, Project, Workhard } from "../../../src";
import { BigNumberish } from "@ethersproject/bignumber";

chai.use(solidity);

describe("Project.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let workhard: Workhard;
  let project: Project;
  let helper: HelperFixture;
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];
    workhard = await getWorkhard();
    helper = await getHelperFixture();
    project = workhard.project.connect(deployer);
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("createProject", () => {
    it("can create a sub project for a project that is a DAO yet", async () => {
      // create project 1
      await expect(project.createProject(0, ""))
        .to.emit(project, "NewProject")
        .withArgs(0, 1);
      expect(await project.daoOf(1)).eq(0);
    });
    it("cannot create a sub project for a project that is not a DAO yet", async () => {
      // revert to create a project which parent DAO is "1"
      await expect(project.createProject(1, "")).to.be.revertedWith(
        "Parent project should be a DAO."
      );
    });
    it("should create projects and point exact parent DAO", async () => {
      await expect(project.createProject(0, ""))
        .to.emit(project, "NewProject")
        .withArgs(0, 1);
      expect(await project.daoOf(1)).eq(0);
      await expect(project.createProject(0, ""))
        .to.emit(project, "NewProject")
        .withArgs(0, 2);
      expect(await project.daoOf(2)).eq(0);
      await expect(project.createProject(0, ""))
        .to.emit(project, "NewProject")
        .withArgs(0, 3);
      expect(await project.daoOf(3)).eq(0);
      await project.upgradeToDAO(
        1,
        defaultDAOParam(helper.multisig.address, helper.baseCurrency.address)
      );
      await project.launch(1, 4750, 4750, 499, 1);
      await project.createProject(1, "");
      expect(await project.daoOf(4)).eq(1);
    });
  });
  describe("upgradeToDAO", () => {
    beforeEach(async () => {
      await project.createProject(0, "");
    });
    it("should increase the growth from 1 to 3", async () => {
      expect(await project.growth(1)).to.eq(1);
      await project.upgradeToDAO(
        1,
        defaultDAOParam(helper.multisig.address, helper.baseCurrency.address)
      );
      expect(await project.growth(1)).to.eq(3);
    });
    it("cannot create a sub project for a project that is not a DAO yet", async () => {
      await expect(
        project.upgradeToDAO(
          1,
          defaultDAOParam(helper.multisig.address, helper.baseCurrency.address)
        )
      )
        .to.emit(project, "DAOLaunched")
        .withArgs(1);
    });
  });
  describe("launch()", () => {
    beforeEach(async () => {
      await project.createProject(0, "");
      await project.upgradeToDAO(
        1,
        defaultDAOParam(helper.multisig.address, helper.baseCurrency.address)
      );
    });
    it("should increase the growth from 3 to 4", async () => {
      expect(await project.growth(1)).to.eq(3);
      await project.launch(1, 4750, 4750, 499, 1);
      expect(await project.growth(1)).to.eq(4);
    });
    it("should emit Start()", async () => {
      const forked = await workhard.getDAO(1);
      await expect(project.launch(1, 4750, 4750, 499, 1)).to.emit(
        forked.visionEmitter,
        "Start"
      );
    });
  });
  describe("updateURI", () => {
    beforeEach(async () => {
      await project.createProject(0, "");
    });
    it("should update the URI", async () => {
      expect(await project.tokenURI(1)).to.eq("ipfs://1");
      await project.updateURI(1, "uri");
      expect(await project.tokenURI(1)).to.eq("ipfs://uri");
    });
    it("should be called only by the project owner", async () => {
      await expect(project.connect(alice).updateURI(1, "uri")).to.be.reverted;
    });
  });
  describe("immortalize", () => {
    beforeEach(async () => {
      await project.createProject(0, "");
    });
    it("should not allow updateURI once its immortalized", async () => {
      expect(await project.immortalized(1)).to.be.false;
      await expect(project.updateURI(1, "uri")).not.to.be.reverted;
      await project.immortalize(1);
      await expect(project.updateURI(1, "uri")).to.be.revertedWith(
        "This project is immortalized."
      );
      expect(await project.immortalized(1)).to.be.true;
    });
  });
  describe("changeMultisig", () => {
    beforeEach(async () => {
      await project.createProject(0, "");
      await project.upgradeToDAO(
        1,
        defaultDAOParam(helper.multisig.address, helper.baseCurrency.address)
      );
      await project.launch(1, 4750, 4750, 499, 1);
    });
    it("should not change the multisig", async () => {
      const prev = await workhard.getDAO(1);
      expect(prev.multisig.address).to.eq(deployer.address);
      await expect(project.changeMultisig(1, alice.address)).not.to.be.reverted;
      const updated = await workhard.getDAO(1);
      expect(updated.multisig.address).to.eq(alice.address);
    });
  });

  describe("getters", () => {
    let forked: DAO;
    let defaultParam: {
      multisig: string;
      treasury: string;
      baseCurrency: string;
      projectName: string;
      projectSymbol: string;
      visionName: string;
      visionSymbol: string;
      commitName: string;
      commitSymbol: string;
      rightName: string;
      rightSymbol: string;
      emissionStartDelay: BigNumberish;
      minDelay: BigNumberish;
      voteLaunchDelay: BigNumberish;
      initialEmission: BigNumberish;
      minEmissionRatePerWeek: BigNumberish;
      emissionCutRate: BigNumberish;
      founderShare: BigNumberish;
    };
    beforeEach(async () => {
      defaultParam = defaultDAOParam(
        helper.multisig.address,
        helper.baseCurrency.address
      );
      await project.createProject(0, "");
      await project.upgradeToDAO(1, defaultParam);
      await project.launch(1, 4750, 4750, 499, 1);
      forked = await workhard.getDAO(1);
    });
    describe("nameOf()", () => {
      it("should return the name of dao", async () => {
        expect(await project.nameOf(1)).to.eq(defaultParam.projectName);
      });
    });
    describe("symbolOf()", () => {
      it("should return the symbol of dao", async () => {
        expect(await project.symbolOf(1)).to.eq(defaultParam.projectSymbol);
      });
    });
    describe("projectsOf()", () => {
      it("should return its number of child projects", async () => {
        expect(await project.projectsOf(0)).to.eq(0);
        await project.createProject(0, "1");
        expect(await project.projectsOf(0)).to.eq(1);
        await project.createProject(0, "2");
        expect(await project.projectsOf(0)).to.eq(2);
      });
    });
    describe("projectsOfDAOByIndex()", () => {
      it("should return its child project's id using the index", async () => {
        await project.createProject(1, "");
        await project.createProject(1, "");
        await project.createProject(1, "");
        await project.createProject(1, "");
        await project.createProject(1, "");
        expect(await project.projectsOfDAOByIndex(1, 0)).to.eq(2);
        expect(await project.projectsOfDAOByIndex(1, 1)).to.eq(3);
        expect(await project.projectsOfDAOByIndex(1, 2)).to.eq(4);
        expect(await project.projectsOfDAOByIndex(1, 3)).to.eq(5);
        expect(await project.projectsOfDAOByIndex(1, 4)).to.eq(6);
      });
    });
    describe("getController()", () => {
      it("should have same property with DAO object", async () => {
        const controller = await project.getController();
        expect(controller).to.haveOwnProperty("multisig");
        expect(controller).to.haveOwnProperty("baseCurrency");
        expect(controller).to.haveOwnProperty("timelock");
        expect(controller).to.haveOwnProperty("vision");
        expect(controller).to.haveOwnProperty("commit");
        expect(controller).to.haveOwnProperty("right");
        expect(controller).to.haveOwnProperty("stableReserve");
        expect(controller).to.haveOwnProperty("contributionBoard");
        expect(controller).to.haveOwnProperty("dividendPool");
        expect(controller).to.haveOwnProperty("voteCounter");
        expect(controller).to.haveOwnProperty("workersUnion");
        expect(controller).to.haveOwnProperty("visionEmitter");
        expect(controller).to.haveOwnProperty("votingEscrow");
      });
    });
    describe("getALLDAOs()", () => {
      it("should return the list of DAOs that are upgraded from projects.", async () => {
        expect(
          (await project.getAllDAOs()).map((bn) => bn.toNumber())
        ).to.deep.eq([0, 1]);
      });
    });
  });
});
