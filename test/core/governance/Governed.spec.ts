import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { constants } from "ethers";
import { goTo } from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Governed } from "../../../src";

chai.use(solidity);

describe("Governed.sol", function () {
  let signers: SignerWithAddress[];
  let initialGov: SignerWithAddress;
  let newGov: SignerWithAddress;
  let governed: Governed;
  before(async () => {
    signers = await ethers.getSigners();
    initialGov = signers[0];
    newGov = signers[1];
    governed = (await (
      await ethers.getContractFactory("Governed")
    ).deploy()) as Governed;
    await governed.initialize(initialGov.address);
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  it("Governance admin functions is only allowed to 'gov' address", async function () {
    const _governed = governed.connect(newGov);
    expect(await governed.gov()).eq(initialGov.address);
    await expect(_governed.anarchize()).to.be.reverted;
    await expect(_governed.setGovernance(newGov.address)).to.be.reverted;
    const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
    await expect(_governed.setAnarchyPoint(timestamp + 1)).to.be.reverted;
  });
  describe("anarchize()", async function () {
    it("is allowed only for the current gov", async function () {
      await expect(governed.connect(newGov).anarchize()).to.be.reverted;
    });
    it("removes the gov control", async function () {
      const _governed = governed.connect(initialGov);
      expect(await _governed.gov()).eq(initialGov.address);
      await expect(_governed.anarchize())
        .to.emit(_governed, "Anarchized")
        .withArgs();
      expect(await _governed.gov()).eq(constants.AddressZero);
    });
  });
  describe("setGovernance()", async function () {
    it("is allowed only for the current gov()", async function () {
      await expect(governed.connect(newGov).setGovernance(newGov.address)).to.be
        .reverted;
    });
    it("changes the gov address and emit NewGovernance()", async function () {
      const _governed = governed.connect(initialGov);
      expect(await _governed.gov()).eq(initialGov.address);
      await expect(_governed.setGovernance(newGov.address))
        .to.emit(_governed, "NewGovernance")
        .withArgs(initialGov.address, newGov.address);
      expect(await _governed.gov()).eq(newGov.address);
    });
  });

  describe("setAnarchyPoint() & forceAnarchize()", async function () {
    it("forceAnarchize does not work until the anarchy point", async () => {
      await expect(governed.connect(initialGov).forceAnarchize()).to.be
        .reverted;
    });
    it("forceAnarchize emits Anarchize() and set gov to 0", async () => {
      const _governed = governed.connect(initialGov);
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      await _governed.setAnarchyPoint(timestamp + 100);
      await expect(_governed.forceAnarchize()).to.be.reverted;
      await goTo(110);
      await expect(_governed.forceAnarchize())
        .to.emit(_governed, "Anarchized")
        .withArgs();
      expect(await _governed.gov()).eq(constants.AddressZero);
      await expect(_governed.setGovernance(newGov.address)).to.be.reverted;
    });
  });

  describe("getters", () => {
    describe("gov", () => {
      it("should return governance account(contract) address", async () => {
        expect(await governed.gov()).to.eq(initialGov.address);
      });
    });
    describe("anarchizedAt", () => {
      it("should return 0 when it is not anarchized", async () => {
        expect(await governed.anarchizedAt()).to.eq(0);
      });
      it("should return the anarchized timestamp after it's anarchized", async () => {
        await governed.anarchize();
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        expect(await governed.anarchizedAt()).to.eq(timestamp);
      });
    });
    describe("forceAnarchizeAt", () => {
      it("should return 0 when the force anarchization point is not set", async () => {
        expect(await governed.forceAnarchizeAt()).to.eq(0);
      });
      it("should return the force anarchization date's timestamp after it's anarchization is setup", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await governed.setAnarchyPoint(timestamp + 10000);
        expect(await governed.forceAnarchizeAt()).to.eq(timestamp + 10000);
      });
    });
  });
});
