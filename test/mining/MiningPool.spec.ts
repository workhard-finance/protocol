import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Signer, Contract, constants, BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { MiningFixture, miningFixture } from "../utils/fixtures";
import { goTo, goToNextWeek } from "../utils/utilities";

chai.use(solidity);

describe("MiningPool.sol", function () {
  let signers: Signer[];
  let deployer: Signer;
  let dev: Signer;
  let alice: Signer;
  let bob: Signer;
  let carl: Signer;
  let deployerAddress: string;
  let devAddress: string;
  let aliceAddress: string;
  let bobAddress: string;
  let carlAddress: string;
  let fixture: MiningFixture;
  let visionToken: Contract;
  let visionTokenEmitter: Contract;
  let timelock: Contract;
  let testingStakeToken: Contract;
  let testingBurnToken: Contract;
  let stakeMiningPool: Contract;
  let burnMiningPool: Contract;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    dev = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    deployerAddress = await deployer.getAddress();
    devAddress = await dev.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carlAddress = await carl.getAddress();
    fixture = await miningFixture(deployer, devAddress);
    visionToken = fixture.visionToken;
    visionTokenEmitter = fixture.visionTokenEmitter;
    timelock = fixture.timelockedGovernance;
    const VisionToken = await ethers.getContractFactory("VisionToken");
    const CommitmentToken = await ethers.getContractFactory("CommitmentToken");
    testingStakeToken = await VisionToken.deploy();
    testingBurnToken = await CommitmentToken.deploy();
    await visionTokenEmitter.newBurnMiningPool(testingBurnToken.address);
    await visionTokenEmitter.newStakeMiningPool(testingStakeToken.address);
    burnMiningPool = await ethers.getContractAt(
      "BurnMining",
      await visionTokenEmitter.callStatic.burnMiningPools(
        testingBurnToken.address
      )
    );
    stakeMiningPool = await ethers.getContractAt(
      "StakeMining",
      await visionTokenEmitter.callStatic.stakeMiningPools(
        testingStakeToken.address
      )
    );
    await visionToken.setMinter(visionTokenEmitter.address);
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await testingStakeToken.mint(addr, parseEther("10000"));
      await testingBurnToken.mint(addr, parseEther("10000"));
      await testingStakeToken
        .connect(account)
        .approve(stakeMiningPool.address, parseEther("10000"));
      await testingBurnToken
        .connect(account)
        .approve(burnMiningPool.address, parseEther("10000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);

    const startTx = await visionTokenEmitter.populateTransaction.start();
    const startTxParams = [
      visionTokenEmitter.address, // target
      0, // value
      startTx.data, // msg.data
      constants.HashZero, // predecessor
      constants.HashZero, // salt
    ];
    const testEmissionRate = [
      [burnMiningPool.address, stakeMiningPool.address],
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
    beforeEach(async () => {
      await goToNextWeek();
      await visionTokenEmitter.distribute();
    });
    describe("Stake Mining Pool", async () => {
      it("should return the value depending on the staking period", async () => {
        const bal0 = await visionToken.callStatic.balanceOf(aliceAddress);
        await stakeMiningPool.connect(alice).stake(parseEther("100"));
        await goTo(10000);
        await stakeMiningPool.connect(alice).exit();
        const bal1 = await visionToken.callStatic.balanceOf(aliceAddress);
        await stakeMiningPool.connect(alice).stake(parseEther("100"));
        await goTo(20000);
        await stakeMiningPool.connect(alice).exit();
        const bal2 = await visionToken.callStatic.balanceOf(aliceAddress);
        expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
      });
      it("should share the reward by the amount of stake", async () => {
        await stakeMiningPool.connect(alice).stake(parseEther("100"));
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await stakeMiningPool.connect(bob).stake(parseEther("100"));
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await stakeMiningPool.connect(carl).stake(parseEther("100"));
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await stakeMiningPool.connect(alice).exit();
        await stakeMiningPool.connect(bob).exit();
        await stakeMiningPool.connect(carl).exit();

        const aliceReward = await visionToken.callStatic.balanceOf(
          aliceAddress
        );
        const bobReward = await visionToken.callStatic.balanceOf(bobAddress);
        const carlReward = await visionToken.callStatic.balanceOf(carlAddress);
        expect(aliceReward.div(1833333333333).div(1e9)).eq(
          bobReward.div(833333333333).div(1e9)
        );
        expect(aliceReward.div(1833333333333).div(1e9)).eq(
          carlReward.div(333333333333).div(1e9)
        );
      });
    });
    describe("Burn Mining Pool", async () => {
      it("should return the value depending on the burned period", async () => {
        const bal0 = await visionToken.callStatic.balanceOf(aliceAddress);
        await burnMiningPool.connect(alice).burn(parseEther("100"));
        await goTo(10000);
        await burnMiningPool.connect(alice).exit();
        const bal1 = await visionToken.callStatic.balanceOf(aliceAddress);
        await burnMiningPool.connect(alice).burn(parseEther("100"));
        await goTo(20000);
        await burnMiningPool.connect(alice).exit();
        const bal2 = await visionToken.callStatic.balanceOf(aliceAddress);
        expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
      });
      it("should share the reward by the amount of burn", async () => {
        await burnMiningPool.connect(alice).burn(parseEther("100"));
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await burnMiningPool.connect(bob).burn(parseEther("100"));
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await burnMiningPool.connect(carl).burn(parseEther("100"));
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await burnMiningPool.connect(alice).exit();
        await burnMiningPool.connect(bob).exit();
        await burnMiningPool.connect(carl).exit();

        const aliceReward = await visionToken.callStatic.balanceOf(
          aliceAddress
        );
        const bobReward = await visionToken.callStatic.balanceOf(bobAddress);
        const carlReward = await visionToken.callStatic.balanceOf(carlAddress);
        expect(aliceReward.div(1833333333333).div(1e9)).eq(
          bobReward.div(833333333333).div(1e9)
        );
        expect(aliceReward.div(1833333333333).div(1e9)).eq(
          carlReward.div(333333333333).div(1e9)
        );
      });
    });
  });
});
