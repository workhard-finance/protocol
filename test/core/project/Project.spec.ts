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
import { Project, Workhard } from "../../../src";

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
      await expect(project.createProject(0, ""))
        .to.emit(project, "NewProject")
        .withArgs(0, 1);
      expect(await project.daoOf(1)).eq(0);
    });
    it("cannot create a sub project for a project that is not a DAO yet", async () => {
      // create project 1
      await project.createProject(0, "");
      // revert to create a project which parent DAO is "1"
      await expect(project.createProject(1, "")).to.be.revertedWith(
        "Parent project should be a DAO."
      );
      // upgrade project 1
      await project.upgradeToDAO(
        1,
        defaultDAOParam(helper.multisig.address, helper.baseCurrency.address)
      );
      // launch project 1
      await project.launch(1, 4750, 4750, 499, 1);
      // succeed to create a project which parent DAO is "1"
      await expect(project.createProject(1, ""))
        .to.emit(project, "NewProject")
        .withArgs(1, 2);
      // its parent should be 1
      expect(await project.daoOf(2)).eq(1);
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
    });
  });
  describe("upgradeToDAO", () => {});
});
