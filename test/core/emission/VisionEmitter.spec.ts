import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Signer, Contract, constants, BigNumber } from "ethers";
import { formatEther, formatUnits, parseEther } from "ethers/lib/utils";
import { getCreate2Address, goTo, goToNextWeek } from "../../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../../scripts/fixtures";

chai.use(solidity);

describe.skip("VisionEmitter.sol", function () {
  let signers: Signer[];
  let deployer: Signer;
  let dev: Signer;
  let alice: Signer;
  let bob: Signer;
  let deployerAddress: string;
  let devAddress: string;
  let fixture: MiningFixture;
  let vision: Contract;
  let visionEmitter: Contract;
  let commitMining: Contract;
  let liquidityMining: Contract;
  let timelock: Contract;
  let initialEmission;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    dev = signers[1];
    alice = signers[2];
    bob = signers[3];
    deployerAddress = await deployer.getAddress();
    devAddress = await dev.getAddress();
    fixture = await getMiningFixture();
    vision = fixture.vision;
    visionEmitter = fixture.visionEmitter;
    timelock = fixture.timelock;
    commitMining = fixture.commitMining;
    liquidityMining = fixture.liquidityMining;
    initialEmission = [
      [commitMining.address, liquidityMining.address],
      [4745, 4745],
      500,
      10,
    ];
  });
  it("VisionEmitter should be governed by the timelock contract at first", async function () {
    expect(await visionEmitter.gov()).eq(timelock.address);
  });

  describe("setEmission", async () => {
    it("should revert tx from unauthenticated addresses", async () => {
      await expect(visionEmitter.setEmission(...initialEmission)).to.be
        .reverted;
    });
    it("should set the emission from the authenticated timelock contract", async () => {
      const tx = await visionEmitter.populateTransaction.setEmission(
        ...initialEmission
      );
      const timelockTxParams = [
        visionEmitter.address, // target
        0, // value
        tx.data, // msg.data
        constants.HashZero, // predecessor
        constants.HashZero, // salt
      ];
      await timelock.schedule(...timelockTxParams, 86400);
      await expect(timelock.execute(...timelockTxParams)).to.be.reverted;
      await goTo(86401);
      await expect(timelock.execute(...timelockTxParams))
        .to.emit(visionEmitter, "EmissionWeightUpdated")
        .withArgs(2);
      expect(await visionEmitter.callStatic.pools(0)).to.be.eq(
        commitMining.address
      );
      expect(await visionEmitter.callStatic.pools(1)).to.be.eq(
        liquidityMining.address
      );
      expect(await visionEmitter.callStatic.getPoolWeight(0)).to.be.eq(4745);
      expect(await visionEmitter.callStatic.getPoolWeight(1)).to.be.eq(4745);
    });
  });
  describe("newBurnMiningPool & newStakeMiningPool", async () => {
    let testingStakeToken: Contract;
    let testingBurnToken: Contract;
    let stakeMiningPool: Contract;
    let burnMiningPool: Contract;
    beforeEach(async () => {
      const VISION = await ethers.getContractFactory("VISION");
      const COMMIT = await ethers.getContractFactory("COMMIT");
      testingStakeToken = await VISION.deploy();
      testingBurnToken = await COMMIT.deploy();
    });
    it("newBurnMiningPool", async () => {
      const burnMiningPoolFactoryAddr = await visionEmitter.callStatic.burnMiningPoolFactory();
      const BurnMining = await ethers.getContractFactory("BurnMining");
      const newBurnMiningPoolAddr = getCreate2Address(
        burnMiningPoolFactoryAddr,
        [vision.address, visionEmitter.address, testingBurnToken.address],
        BurnMining.bytecode
      );
      await expect(visionEmitter.newBurnMiningPool(testingBurnToken.address))
        .to.emit(visionEmitter, "NewBurnMiningPool")
        .withArgs(testingBurnToken.address, newBurnMiningPoolAddr);
    });
    it("newStakeMiningPool", async () => {
      const stakeMiningPoolFactoryAddr = await visionEmitter.callStatic.stakeMiningPoolFactory();
      const StakeMining = await ethers.getContractFactory("StakeMining");
      const newStakeMiningPoolAddr = getCreate2Address(
        stakeMiningPoolFactoryAddr,
        [vision.address, visionEmitter.address, testingStakeToken.address],
        StakeMining.bytecode
      );
      await expect(visionEmitter.newStakeMiningPool(testingStakeToken.address))
        .to.emit(visionEmitter, "NewStakeMiningPool")
        .withArgs(testingStakeToken.address, newStakeMiningPoolAddr);
    });
  });
  describe("start() & distribute()", async () => {
    let testingStakeToken: Contract;
    let testingBurnToken: Contract;
    let testingStakeMiningPool: Contract;
    let testingBurnMiningPool: Contract;
    beforeEach(async () => {
      const VISION = await ethers.getContractFactory("VISION");
      const COMMIT = await ethers.getContractFactory("COMMIT");
      testingStakeToken = await VISION.deploy();
      testingBurnToken = await COMMIT.deploy();
      await visionEmitter.newBurnMiningPool(testingBurnToken.address);
      await visionEmitter.newStakeMiningPool(testingStakeToken.address);
      testingBurnMiningPool = await ethers.getContractAt(
        "BurnMining",
        await visionEmitter.callStatic.burnMiningPools(testingBurnToken.address)
      );
      testingStakeMiningPool = await ethers.getContractAt(
        "BurnMining",
        await visionEmitter.callStatic.stakeMiningPools(
          testingStakeToken.address
        )
      );
    });
    it("distribute() should fail before it starts", async () => {
      await expect(visionEmitter.distribute()).to.be.reverted;
    });
    describe("after start() executed", async () => {
      beforeEach(async () => {
        const startTx = await visionEmitter.populateTransaction.start();
        const startTxParams = [
          visionEmitter.address, // target
          0, // value
          startTx.data, // msg.data
          constants.HashZero, // predecessor
          constants.HashZero, // salt
        ];
        const testEmissionRate = [
          [testingBurnMiningPool.address, testingStakeMiningPool.address],
          [4745, 4745],
          500,
          10,
        ];
        const setEmissionTx = await visionEmitter.populateTransaction.setEmission(
          ...testEmissionRate
        );
        const setEmissionTxParams = [
          visionEmitter.address, // target
          0, // value
          setEmissionTx.data, // msg.data
          constants.HashZero, // predecessor
          constants.HashZero, // salt
        ];
        await timelock.schedule(...startTxParams, 86400);
        await timelock.schedule(...setEmissionTxParams, 86400);
        await goTo(86401);
        await timelock.execute(...setEmissionTxParams);
        await timelock.execute(...startTxParams);
      });
      describe("distribute()", async () => {
        it("should fail when if the emission rate is not set properly", async () => {
          await expect(visionEmitter.distribute()).to.be.reverted;
        });
        it("should allocate rewards properly after 7 days", async () => {
          await goToNextWeek();
          await expect(visionEmitter.distribute())
            .to.emit(visionEmitter, "TokenEmission")
            .withArgs(INITIAL_EMISSION_AMOUNT);
          expect(await vision.callStatic.totalSupply()).to.eq(
            INITIAL_EMISSION_AMOUNT
          );
        });
        const weeklyStat = [];
        weeklyStat.push({
          weekNum: 0,
          emission: INITIAL_EMISSION_AMOUNT,
          totalSupply: INITIAL_EMISSION_AMOUNT,
        });
        let totalSupply = INITIAL_EMISSION_AMOUNT;
        for (let weekNum = 1; weekNum < 52; weekNum++) {
          const cutEmission = Array(weekNum)
            .fill(0)
            .reduce((acc, _) => acc.mul(70).div(100), INITIAL_EMISSION_AMOUNT);
          const minimum = totalSupply.mul(60).div(10000);
          const emission = cutEmission.gt(minimum) ? cutEmission : minimum;
          totalSupply = totalSupply.add(emission);
          weeklyStat.push({
            weekNum,
            emission,
            totalSupply,
          });
        }
        const firstYearSupply = totalSupply;
        for (let weekNum = 0; weekNum < 52; weekNum++) {
          weeklyStat[weekNum].per = weeklyStat[weekNum].emission
            .mul(10000)
            .div(firstYearSupply);
        }
        for (let weekNum = 0; weekNum < 52; weekNum++) {
          const stat = weeklyStat[weekNum];
          const per = formatUnits(stat.per.toString(), 2);
          const emission = parseFloat(
            formatEther(stat.emission.toString())
          ).toFixed(2);
          const totalSupply = parseFloat(
            formatEther(stat.totalSupply.toString())
          ).toFixed(2);
          it(`emission of week ${weekNum}(${per}% of the 1 year supply) should be ${emission} and total supply should be ${totalSupply}`, async () => {
            // await testingStakeMiningPool.connect(alice).stake();
            for (let w = 0; w < weekNum; w++) {
              await goToNextWeek();
              await visionEmitter.distribute();
            }
            await goToNextWeek();
            await expect(visionEmitter.distribute())
              .to.emit(visionEmitter, "TokenEmission")
              .withArgs(stat.emission);
            expect(await vision.totalSupply()).to.eq(stat.totalSupply);
          });
        }
      });
    });
  });
});
