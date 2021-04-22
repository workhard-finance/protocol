import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Signer, Contract, BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { goTo, runTimelockTx } from "../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../scripts/fixtures";

chai.use(solidity);

describe("VisionFarm.sol", function () {
  let signers: Signer[];
  let deployer: Signer;
  let planter: Signer;
  let alice: Signer;
  let bob: Signer;
  let carl: Signer;
  let deployerAddress: string;
  let planterAddress: string;
  let aliceAddress: string;
  let bobAddress: string;
  let carlAddress: string;
  let fixture: MiningFixture;
  let visionToken: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  let testingRewardToken: Contract;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    planter = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    deployerAddress = await deployer.getAddress();
    planterAddress = await planter.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carlAddress = await carl.getAddress();
    fixture = await getMiningFixture({ skipMinterSetting: true });
    visionToken = fixture.visionToken;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    testingRewardToken = await ERC20.deploy();
    await testingRewardToken.mint(planterAddress, parseEther("10000"));
    await testingRewardToken
      .connect(planter)
      .approve(visionFarm.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await visionToken.mint(addr, parseEther("10000"));
      await visionToken
        .connect(account)
        .approve(visionFarm.address, parseEther("10000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
  });
  describe("getCurrentEpoch()", async () => {
    it("should start from 0", async () => {
      expect(await visionFarm.callStatic.getCurrentEpoch()).eq(0);
    });
    it("should increment by monthly", async () => {
      expect(await visionFarm.callStatic.getCurrentEpoch()).eq(0);
      await goTo(3600 * 24 * 7 * 4);
      expect(await visionFarm.callStatic.getCurrentEpoch()).eq(1);
      await goTo(3600 * 24 * 7 * 4);
      expect(await visionFarm.callStatic.getCurrentEpoch()).eq(2);
    });
  });
  describe("stakeAndLock()", async () => {
    beforeEach(async () => {
      await visionFarm.connect(alice).stakeAndLock(parseEther("100"), 4);
      await visionFarm.connect(bob).stakeAndLock(parseEther("10"), 4);
      await visionFarm.connect(carl).stakeAndLock(parseEther("100"), 2);
    });
    it("maximum lock period is 50", async () => {
      await visionFarm.connect(carl).stakeAndLock(parseEther("100"), 50);
      await expect(visionFarm.connect(carl).stakeAndLock(parseEther("100"), 51))
        .to.be.reverted;
    });
    describe("dispatchableFarmers(epochNum)", async () => {
      it("should be proportional to the amount of stake and its remaining locked period", async () => {
        const epoch1aliceDispatchable = await visionFarm.dispatchableFarmers(
          aliceAddress,
          1
        );
        const epoch1bobDispatchable = await visionFarm.dispatchableFarmers(
          bobAddress,
          1
        );
        const epoch1carlDispatchable = await visionFarm.dispatchableFarmers(
          carlAddress,
          1
        );
        expect(epoch1aliceDispatchable.div(10)).eq(epoch1bobDispatchable);
        expect(epoch1aliceDispatchable.div(2)).eq(epoch1carlDispatchable);
        const epoch2aliceDispatchable = await visionFarm.dispatchableFarmers(
          aliceAddress,
          2
        );
        const epoch3aliceDispatchable = await visionFarm.dispatchableFarmers(
          aliceAddress,
          3
        );
        const epoch4aliceDispatchable = await visionFarm.dispatchableFarmers(
          aliceAddress,
          4
        );
        expect(epoch1aliceDispatchable.div(4)).eq(
          epoch2aliceDispatchable.div(3)
        );
        expect(epoch1aliceDispatchable.div(4)).eq(
          epoch3aliceDispatchable.div(2)
        );
        expect(epoch1aliceDispatchable.div(4)).eq(
          epoch4aliceDispatchable.div(1)
        );
      });
      it("should be unstakeable after its locking period", async () => {
        await expect(visionFarm.connect(alice).unstake(parseEther("100"))).to.be
          .reverted;
        const epochs = 5;
        await goTo(3600 * 24 * 7 * 4 * epochs);
        const prevBal = await visionToken.callStatic.balanceOf(aliceAddress);
        await visionFarm.connect(alice).unstake(parseEther("100"));
        const updatedBal = await visionToken.callStatic.balanceOf(aliceAddress);
        expect(updatedBal).eq(prevBal.add(parseEther("100")));
      });
    });
  });
  describe("plantSeeds() & dispatchFarmers() & harvest()", async () => {
    beforeEach(async () => {
      await runTimelockTx(
        timelock,
        visionFarm.populateTransaction.addPlanter(planterAddress)
      );
      await visionFarm
        .connect(planter)
        .plantSeeds(testingRewardToken.address, parseEther("100"));
      await visionFarm.connect(alice).stakeAndLock(parseEther("100"), 4);
      await visionFarm.connect(bob).stakeAndLock(parseEther("10"), 40);
      await visionFarm.connect(carl).stakeAndLock(parseEther("100"), 2);
    });
    it("batchDispatch() automatically dispatches farmers for the future epochs", async () => {
      await visionFarm.connect(alice).batchDispatch(); // dispatch farmers for epoch 1 & epoch 2
      await goTo(3600 * 24 * 7 * 4 * 2); // go to epoch 2
      await visionFarm.connect(alice).harvestAll(1);
      await expect(visionFarm.connect(alice).withdrawAll())
        .to.emit(testingRewardToken, "Transfer")
        .withArgs(visionFarm.address, aliceAddress, parseEther("100")); // harvest for epoch 1
      await goTo(3600 * 24 * 7 * 4); // go to epoch 3
      // no seed were planted for epoch 2.
      await visionFarm.connect(alice).harvestAll(2);
      await expect(visionFarm.connect(alice).withdrawAll()).not.to.emit(
        testingRewardToken,
        "Transfer"
      ); // harvest for epoch 2
    });
    it("harvest()", async () => {
      await visionFarm.connect(alice).batchDispatch(); // dispatch farmers for epoch 1 & epoch 2
      await visionFarm.connect(bob).batchDispatch(); // dispatch farmers for epoch 1 & epoch 2
      await visionFarm.connect(carl).batchDispatch(); // dispatch farmers for epoch 1 & epoch 2
      await goTo(3600 * 24 * 7 * 4 * 2); // go to epoch 2
      await visionFarm.connect(alice).harvestAll(1);
      await expect(visionFarm.connect(alice).withdrawAll())
        .to.emit(testingRewardToken, "Transfer")
        .withArgs(
          visionFarm.address,
          aliceAddress,
          parseEther("100").mul(400).div(1000)
        ); // alice harvests for epoch 1
      await visionFarm.connect(bob).harvestAll(1);
      await expect(visionFarm.connect(bob).withdrawAll())
        .to.emit(testingRewardToken, "Transfer")
        .withArgs(
          visionFarm.address,
          bobAddress,
          parseEther("100").mul(400).div(1000)
        ); // bob harvests for epoch 1
      await visionFarm.connect(carl).harvestAll(1);
      await expect(visionFarm.connect(carl).withdrawAll())
        .to.emit(testingRewardToken, "Transfer")
        .withArgs(
          visionFarm.address,
          carlAddress,
          parseEther("100").mul(200).div(1000)
        ); // carl harvests for epoch 1
    });
  });
});
