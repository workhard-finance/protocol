import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { constants } from "ethers";
import { goTo } from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Governed, Governed__factory } from "../../../src";

chai.use(solidity);

describe("Governed.sol", function () {
  let signers: SignerWithAddress[];
  let initialGov: SignerWithAddress;
  let newGov: SignerWithAddress;
  let governed: Governed;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    initialGov = signers[0];
    newGov = signers[1];
    governed = await new Governed__factory(initialGov).deploy();
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
});
