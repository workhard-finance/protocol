import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { constants, BigNumber } from "ethers";
import { formatEther, formatUnits, parseEther } from "ethers/lib/utils";
import {
  getCreate2Address,
  goTo,
  goToNextWeek,
  runTimelockTx,
} from "../../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../../scripts/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  BurnMining,
  BurnMining__factory,
  COMMIT,
  COMMIT__factory,
  StakeMining,
  StakeMining__factory,
  TimelockedGovernance,
  VISION,
  VisionEmitter,
  VISION__factory,
} from "../../../src";

chai.use(solidity);

describe("VisionEmitter.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: MiningFixture;
  let vision: VISION;
  let visionEmitter: VisionEmitter;
  let commitMining: BurnMining;
  let liquidityMining: StakeMining;
  let timelock: TimelockedGovernance;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  let initialEmission;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    dev = signers[1];
    alice = signers[2];
    bob = signers[3];
    fixture = await getMiningFixture();
    vision = fixture.vision;
    visionEmitter = fixture.visionEmitter;
    timelock = fixture.timelock;
    commitMining = fixture.commitMining;
    liquidityMining = fixture.liquidityMining;
    initialEmission = {
      pools: [commitMining.address, liquidityMining.address],
      weights: [4745, 4745],
      protocol: 499,
      caller: 1,
    };
  });
  it("VisionEmitter should be governed by the timelock contract at first", async function () {
    expect(await visionEmitter.gov()).eq(timelock.address);
  });

  describe("setEmission", async () => {
    it("should revert tx from unauthenticated addresses", async () => {
      await expect(
        visionEmitter.setEmission(
          initialEmission.pools,
          initialEmission.weights,
          initialEmission.protocol,
          initialEmission.caller
        )
      ).to.be.reverted;
    });
    it("should set the emission from the authenticated timelock contract", async () => {
      const tx = await visionEmitter.populateTransaction.setEmission(
        initialEmission.pools,
        initialEmission.weights,
        initialEmission.protocol,
        initialEmission.caller
      );
      const timelockTxParams = {
        target: visionEmitter.address, // target
        value: 0, // value
        data: tx.data, // msg.data
        predecessor: constants.HashZero, // predecessor
        salt: constants.HashZero, // salt
      };
      await timelock.schedule(
        timelockTxParams.target,
        timelockTxParams.value,
        timelockTxParams.data,
        timelockTxParams.predecessor,
        timelockTxParams.salt,
        86400
      );
      await expect(
        timelock.execute(
          timelockTxParams.target,
          timelockTxParams.value,
          timelockTxParams.data,
          timelockTxParams.predecessor,
          timelockTxParams.salt
        )
      ).to.be.reverted;
      await goTo(86401);
      await expect(
        timelock.execute(
          timelockTxParams.target,
          timelockTxParams.value,
          timelockTxParams.data,
          timelockTxParams.predecessor,
          timelockTxParams.salt
        )
      )
        .to.emit(visionEmitter, "EmissionWeightUpdated")
        .withArgs(2);
      expect(await visionEmitter.pools(0)).to.be.eq(commitMining.address);
      expect(await visionEmitter.pools(1)).to.be.eq(liquidityMining.address);
      expect(await visionEmitter.getPoolWeight(0)).to.be.eq(4745);
      expect(await visionEmitter.getPoolWeight(1)).to.be.eq(4745);
    });
  });
  describe("newBurnMiningPool & newStakeMiningPool", async () => {
    let testingStakeToken: VISION;
    let testingBurnToken: COMMIT;
    beforeEach(async () => {
      testingStakeToken = await new VISION__factory(deployer).deploy();
      testingBurnToken = await new COMMIT__factory(deployer).deploy();
    });
    it("newBurnMiningPool", async () => {
      const burnMiningPoolFactoryAddr = await visionEmitter.burnMiningPoolFactory();
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
      const stakeMiningPoolFactoryAddr = await visionEmitter.stakeMiningPoolFactory();
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
    let testingStakeToken: VISION;
    let testingBurnToken: COMMIT;
    let testingStakeMiningPool: StakeMining;
    let testingBurnMiningPool: BurnMining;
    beforeEach(async () => {
      testingStakeToken = await new VISION__factory(deployer).deploy();
      testingBurnToken = await new COMMIT__factory(deployer).deploy();
      await visionEmitter.newBurnMiningPool(testingBurnToken.address);
      await visionEmitter.newStakeMiningPool(testingStakeToken.address);
      testingBurnMiningPool = BurnMining__factory.connect(
        await visionEmitter.burnMiningPools(testingBurnToken.address),
        deployer
      );
      testingStakeMiningPool = StakeMining__factory.connect(
        await visionEmitter.stakeMiningPools(testingStakeToken.address),
        deployer
      );
    });
    it("distribute() should fail before it starts", async () => {
      await expect(visionEmitter.distribute()).to.be.reverted;
    });
    describe("after start() executed", async () => {
      beforeEach(async () => {
        await runTimelockTx(
          timelock,
          visionEmitter.populateTransaction.start(),
          86400
        );
        await runTimelockTx(
          timelock,
          visionEmitter.populateTransaction.setEmission(
            [testingBurnMiningPool.address, testingStakeMiningPool.address],
            [4745, 4745],
            500,
            10
          ),
          86400
        );
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
          expect(await vision.totalSupply()).to.eq(INITIAL_EMISSION_AMOUNT);
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
