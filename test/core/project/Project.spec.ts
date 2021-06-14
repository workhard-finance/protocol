import hre, { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { keccak256, parseEther, solidityPack } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getWorkhard } from "../../../scripts/fixtures";
import { Workhard } from "../../../src";

chai.use(solidity);

describe("Project.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let workhard: Workhard;
  before(async () => {
    signers = await hre.ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];
    workhard = await getWorkhard();
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("createProject", () => {
    workhard.project.createProject(0, "");
  });
});
