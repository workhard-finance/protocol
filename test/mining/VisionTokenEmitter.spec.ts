import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Signer, Contract, constants, BigNumber } from "ethers";
import { formatEther, formatUnits, parseEther } from "ethers/lib/utils";
import { MiningFixture, miningFixture } from "../utils/fixtures";
import { getCreate2Address, goToNextWeek } from "../utils/utilities";

chai.use(solidity);

describe("VisionTokenEmitter.sol", function () {
  let signers: Signer[];
  let deployer: Signer;
  let dev: Signer;
  let alice: Signer;
  let bob: Signer;
  let deployerAddress: string;
  let devAddress: string;
  let fixture: MiningFixture;
  let visionToken: Contract;
  let visionTokenEmitter: Contract;
  let commitmentMining: Contract;
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
    fixture = await miningFixture(deployer, devAddress);
    visionToken = fixture.visionToken;
    visionTokenEmitter = fixture.visionTokenEmitter;
    timelock = fixture.timelockedGovernance;
    commitmentMining = fixture.commitmentMining;
    liquidityMining = fixture.liquidityMining;
    initialEmission = [
      [commitmentMining.address, liquidityMining.address],
      [4745, 4745],
      500,
      10,
    ];
  });
  it("VisionTokenEmitter should be governed by the timelock contract at first", async function () {
    expect(await visionTokenEmitter.gov()).eq(timelock.address);
  });

  describe("setEmission", async () => {
    it("should revert tx from unauthenticated addresses", async () => {
      await expect(visionTokenEmitter.setEmission(...initialEmission)).to.be
        .reverted;
    });
    it("should set the emission from the authenticated timelock contract", async () => {
      const tx = await visionTokenEmitter.populateTransaction.setEmission(
        ...initialEmission
      );
      const timelockTxParams = [
        visionTokenEmitter.address, // target
        0, // value
        tx.data, // msg.data
        constants.HashZero, // predecessor
        constants.HashZero, // salt
      ];
      await timelock.schedule(...timelockTxParams, 86400);
      await expect(timelock.execute(...timelockTxParams)).to.be.reverted;
      await ethers.provider.send("evm_setNextBlockTimestamp", [
        (await ethers.provider.getBlock("latest")).timestamp + 86401,
      ]);
      await expect(timelock.execute(...timelockTxParams))
        .to.emit(visionTokenEmitter, "EmissionWeightUpdated")
        .withArgs(2);
      expect(await visionTokenEmitter.callStatic.pools(0)).to.be.eq(
        commitmentMining.address
      );
      expect(await visionTokenEmitter.callStatic.pools(1)).to.be.eq(
        liquidityMining.address
      );
      expect(await visionTokenEmitter.callStatic.getPoolWeight(0)).to.be.eq(
        4745
      );
      expect(await visionTokenEmitter.callStatic.getPoolWeight(1)).to.be.eq(
        4745
      );
    });
  });
  describe("newBurnMiningPool & newStakeMiningPool", async () => {
    let testingStakeToken: Contract;
    let testingBurnToken: Contract;
    let stakeMiningPool: Contract;
    let burnMiningPool: Contract;
    beforeEach(async () => {
      const VisionToken = await ethers.getContractFactory("VisionToken");
      const CommitmentToken = await ethers.getContractFactory(
        "CommitmentToken"
      );
      testingStakeToken = await VisionToken.deploy();
      testingBurnToken = await CommitmentToken.deploy();
    });
    it("newBurnMiningPool", async () => {
      const burnMiningPoolFactoryAddr = await visionTokenEmitter.callStatic.burnMiningPoolFactory();
      const BurnMining = await ethers.getContractFactory("BurnMining");
      const newBurnMiningPoolAddr = getCreate2Address(
        burnMiningPoolFactoryAddr,
        [
          visionToken.address,
          visionTokenEmitter.address,
          testingBurnToken.address,
        ],
        BurnMining.bytecode
      );
      await expect(
        visionTokenEmitter.newBurnMiningPool(testingBurnToken.address)
      )
        .to.emit(visionTokenEmitter, "NewBurnMiningPool")
        .withArgs(testingBurnToken.address, newBurnMiningPoolAddr);
    });
    it("newStakeMiningPool", async () => {
      const stakeMiningPoolFactoryAddr = await visionTokenEmitter.callStatic.stakeMiningPoolFactory();
      const StakeMining = await ethers.getContractFactory("StakeMining");
      const newStakeMiningPoolAddr = getCreate2Address(
        stakeMiningPoolFactoryAddr,
        [
          visionToken.address,
          visionTokenEmitter.address,
          testingStakeToken.address,
        ],
        StakeMining.bytecode
      );
      await expect(
        visionTokenEmitter.newStakeMiningPool(testingStakeToken.address)
      )
        .to.emit(visionTokenEmitter, "NewStakeMiningPool")
        .withArgs(testingStakeToken.address, newStakeMiningPoolAddr);
    });
  });
  describe("start() & distribute()", async () => {
    let testingStakeToken: Contract;
    let testingBurnToken: Contract;
    let testingStakeMiningPool: Contract;
    let testingBurnMiningPool: Contract;
    beforeEach(async () => {
      await visionToken.setMinter(visionTokenEmitter.address);
      const VisionToken = await ethers.getContractFactory("VisionToken");
      const CommitmentToken = await ethers.getContractFactory(
        "CommitmentToken"
      );
      testingStakeToken = await VisionToken.deploy();
      testingBurnToken = await CommitmentToken.deploy();
      await visionTokenEmitter.newBurnMiningPool(testingBurnToken.address);
      await visionTokenEmitter.newStakeMiningPool(testingStakeToken.address);
      testingBurnMiningPool = await ethers.getContractAt(
        "BurnMining",
        await visionTokenEmitter.callStatic.burnMiningPools(
          testingBurnToken.address
        )
      );
      testingStakeMiningPool = await ethers.getContractAt(
        "BurnMining",
        await visionTokenEmitter.callStatic.stakeMiningPools(
          testingStakeToken.address
        )
      );
    });
    it("distribute() should fail before it starts", async () => {
      await expect(visionTokenEmitter.distribute()).to.be.reverted;
    });
    describe("after start() executed", async () => {
      beforeEach(async () => {
        const startTx = await visionTokenEmitter.populateTransaction.start();
        const startTxParams = [
          visionTokenEmitter.address, // target
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
        const setEmissionTx = await visionTokenEmitter.populateTransaction.setEmission(
          ...testEmissionRate
        );
        const setEmissionTxParams = [
          visionTokenEmitter.address, // target
          0, // value
          setEmissionTx.data, // msg.data
          constants.HashZero, // predecessor
          constants.HashZero, // salt
        ];
        await timelock.schedule(...startTxParams, 86400);
        await timelock.schedule(...setEmissionTxParams, 86400);
        await ethers.provider.send("evm_setNextBlockTimestamp", [
          (await ethers.provider.getBlock("latest")).timestamp + 86401,
        ]);
        await timelock.execute(...setEmissionTxParams);
        await timelock.execute(...startTxParams);
      });
      describe("distribute()", async () => {
        it("should fail when if the emission rate is not set properly", async () => {
          await expect(visionTokenEmitter.distribute()).to.be.reverted;
        });
        it("should allocate rewards properly after 7 days", async () => {
          await goToNextWeek();
          await expect(visionTokenEmitter.distribute())
            .to.emit(visionTokenEmitter, "TokenEmission")
            .withArgs(INITIAL_EMISSION_AMOUNT);
          expect(await visionToken.callStatic.totalSupply()).to.eq(
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
          const halvenedEmission = INITIAL_EMISSION_AMOUNT.div(2 ** weekNum);
          const minimum = totalSupply.mul(60).div(10000);
          const emission = halvenedEmission.gt(minimum)
            ? halvenedEmission
            : minimum;
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
              await visionTokenEmitter.distribute();
            }
            await goToNextWeek();
            await expect(visionTokenEmitter.distribute())
              .to.emit(visionTokenEmitter, "TokenEmission")
              .withArgs(stat.emission);
            expect(await visionToken.totalSupply()).to.eq(stat.totalSupply);
          });
        }
      });
    });
  });
});
