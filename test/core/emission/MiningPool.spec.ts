import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import {
  goTo,
  goToNextWeek,
  runTimelockTx,
  setNextBlockTimestamp,
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

describe("MiningPool.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let fixture: MiningFixture;
  let vision: VISION;
  let visionEmitter: VisionEmitter;
  let timelock: TimelockedGovernance;
  let testingStakeToken: VISION;
  let testingBurnToken: COMMIT;
  let stakeMiningPool: StakeMining;
  let burnMiningPool: BurnMining;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    dev = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    fixture = await getMiningFixture();
    vision = fixture.vision;
    visionEmitter = fixture.visionEmitter;
    timelock = fixture.timelock;
    testingStakeToken = await new VISION__factory(deployer).deploy();
    testingBurnToken = await new COMMIT__factory(deployer).deploy();
    await visionEmitter.newBurnMiningPool(testingBurnToken.address);
    await visionEmitter.newStakeMiningPool(testingStakeToken.address);
    burnMiningPool = BurnMining__factory.connect(
      await visionEmitter.burnMiningPools(testingBurnToken.address),
      deployer
    );
    stakeMiningPool = StakeMining__factory.connect(
      await visionEmitter.stakeMiningPools(testingStakeToken.address),
      deployer
    );
    const prepare = async (account: SignerWithAddress) => {
      await testingStakeToken.mint(account.address, parseEther("10000"));
      await testingBurnToken.mint(account.address, parseEther("10000"));
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

    await runTimelockTx(
      timelock,
      visionEmitter.populateTransaction.start(),
      86400
    );
    await runTimelockTx(
      timelock,
      visionEmitter.populateTransaction.setEmission(
        [burnMiningPool.address, stakeMiningPool.address],
        [4745, 4745],
        500,
        10
      ),
      86400
    );
  });
  describe("distribute()", async () => {
    beforeEach(async () => {
      await goToNextWeek();
      await visionEmitter.distribute();
    });
    describe("Stake Mining Pool", async () => {
      it("should return the value depending on the staking period", async () => {
        const bal0 = await vision.balanceOf(alice.address);
        await stakeMiningPool.connect(alice).stake(parseEther("100"));
        await setNextBlockTimestamp(10000);
        await stakeMiningPool.connect(alice).exit();
        const bal1 = await vision.balanceOf(alice.address);
        await stakeMiningPool.connect(alice).stake(parseEther("100"));
        await setNextBlockTimestamp(20000);
        await stakeMiningPool.connect(alice).exit();
        const bal2 = await vision.balanceOf(alice.address);
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

        const aliceReward = await vision.balanceOf(alice.address);
        const bobReward = await vision.balanceOf(bob.address);
        const carlReward = await vision.balanceOf(carl.address);
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
        const bal0 = await vision.balanceOf(alice.address);
        await burnMiningPool.connect(alice).burn(parseEther("100"));
        await setNextBlockTimestamp(10000);
        await burnMiningPool.connect(alice).exit();
        const bal1 = await vision.balanceOf(alice.address);
        await burnMiningPool.connect(alice).burn(parseEther("100"));
        await setNextBlockTimestamp(20000);
        await burnMiningPool.connect(alice).exit();
        const bal2 = await vision.balanceOf(alice.address);
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

        const aliceReward = await vision.balanceOf(alice.address);
        const bobReward = await vision.balanceOf(bob.address);
        const carlReward = await vision.balanceOf(carl.address);
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
