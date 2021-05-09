import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { goTo, runTimelockTx } from "../../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../../scripts/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

const day = 86400;
const week = day * 7;
const year = day * 365;
describe("DividendPool.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let distributor: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let fixture: MiningFixture;
  let vision: Contract;
  let dividendPool: Contract;
  let veLocker: Contract;
  let timelock: Contract;
  let testingRewardToken: Contract;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    distributor = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    fixture = await getMiningFixture({ skipMinterSetting: true });
    vision = fixture.vision;
    dividendPool = fixture.dividendPool;
    veLocker = fixture.veLocker;
    timelock = fixture.timelock;
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    testingRewardToken = await ERC20.deploy();
    await testingRewardToken.mint(distributor.address, parseEther("10000"));
    await testingRewardToken
      .connect(distributor)
      .approve(dividendPool.address, parseEther("10000"));
    const prepare = async (account: SignerWithAddress) => {
      const addr = await account.getAddress();
      await vision.mint(addr, parseEther("10000"));
      await vision
        .connect(account)
        .approve(veLocker.address, parseEther("10000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
  });
  describe("getCurrentEpoch()", async () => {
    it("should start from 0", async () => {
      let timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const startEpoch = Math.floor(timestamp / week);
      expect(await dividendPool.callStatic.getCurrentEpoch()).eq(startEpoch);
    });
    it("should increment by weekly", async () => {
      let timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      const startEpoch = Math.floor(timestamp / week);
      expect(await dividendPool.callStatic.getCurrentEpoch()).eq(startEpoch);
      await goTo(4 * week);
      expect(await dividendPool.callStatic.getCurrentEpoch()).eq(
        startEpoch + 4
      );
      await goTo(3 * week);
      expect(await dividendPool.callStatic.getCurrentEpoch()).eq(
        startEpoch + 7
      );
    });
  });
  describe("distribute() & claim()", async () => {
    beforeEach(async () => {
      const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      await veLocker
        .connect(alice)
        .createLockUntil(parseEther("100"), timestamp + 4 * year);
      await veLocker
        .connect(bob)
        .createLockUntil(parseEther("10"), timestamp + 4 * year);
      await veLocker
        .connect(carl)
        .createLockUntil(parseEther("100"), timestamp + 4 * year);
      await runTimelockTx(
        timelock,
        dividendPool.populateTransaction.addDistributor(distributor.address)
      );
      await dividendPool
        .connect(distributor)
        .distribute(testingRewardToken.address, parseEther("100"));
    });
    describe("claimUpTo()", () => {
      it("should be reverted since the target timestamp is bein updated", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await expect(
          dividendPool
            .connect(alice)
            .claimUpTo(testingRewardToken.address, timestamp)
        ).to.be.reverted;
      });
      it("can claim after the epoch changes", async () => {
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await goTo(1 * week);
        await dividendPool
          .connect(alice)
          .claimUpTo(testingRewardToken.address, timestamp);
      });
    });
  });
});
