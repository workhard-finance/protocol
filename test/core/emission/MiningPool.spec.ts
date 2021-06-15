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
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ERC20BurnMiningV1,
  ERC20BurnMiningV1__factory,
  ERC20StakeMiningV1,
  ERC20StakeMiningV1__factory,
  TimelockedGovernance,
  VISION,
  VisionEmitter,
  ERC721,
  ERC721__factory,
  ERC1155,
  ERC1155__factory,
  ERC721StakeMiningV1,
  ERC1155StakeMiningV1,
  ERC721StakeMiningV1__factory,
  ERC1155StakeMiningV1__factory,
  DAO,
  Workhard,
  ERC20__factory,
  ERC20,
  ERC1155BurnMiningV1,
  InitialContributorShare,
  InitialContributorShare__factory,
  ERC1155BurnMiningV1__factory,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("MiningPool.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let workhard: Workhard;
  let masterDAO: DAO;
  let vision: VISION;
  let visionEmitter: VisionEmitter;
  let timelock: TimelockedGovernance;
  let testingStakeToken: ERC20;
  let testingBurnToken: ERC20;
  let testingERC721: ERC721;
  let testingERC1155: ERC1155;
  let erc20StakeMining: ERC20StakeMiningV1;
  let erc20BurnMining: ERC20BurnMiningV1;
  let erc721StakeMining: ERC721StakeMiningV1;
  let erc1155StakeMining: ERC1155StakeMiningV1;
  let erc1155BurnMining: ERC1155BurnMiningV1;
  let initialContributorShare: InitialContributorShare;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  before(async () => {
    this.timeout(60000);
    signers = await ethers.getSigners();
    deployer = signers[0];
    dev = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    workhard = await getWorkhard();
    masterDAO = await workhard.getMasterDAO({ account: deployer });
    vision = masterDAO.vision;
    visionEmitter = masterDAO.visionEmitter;
    timelock = masterDAO.timelock;
    testingStakeToken = await new ERC20__factory(deployer).deploy();
    testingBurnToken = await new ERC20__factory(deployer).deploy();
    testingERC721 = await new ERC721__factory(deployer).deploy();
    testingERC1155 = await new ERC1155__factory(deployer).deploy();
    const erc20BurnMiningV1SigHash =
      await workhard.commons.erc20BurnMiningV1Factory.poolType();
    const erc20StakeMiningV1SigHash =
      await workhard.commons.erc20StakeMiningV1Factory.poolType();
    const erc1155BurnMiningV1SigHash =
      await workhard.commons.erc1155BurnMiningV1Factory.poolType();
    const erc1155StakeMiningV1SigHash =
      await workhard.commons.erc1155StakeMiningV1Factory.poolType();
    const erc721StakeMiningV1SigHash =
      await workhard.commons.erc721StakeMiningV1Factory.poolType();
    const initialContributorShareSigHash =
      await workhard.commons.initialContributorShareFactory.poolType();
    await visionEmitter.newPool(
      erc20BurnMiningV1SigHash,
      testingBurnToken.address
    );
    await visionEmitter.newPool(
      erc20StakeMiningV1SigHash,
      testingStakeToken.address
    );
    await visionEmitter.newPool(
      erc1155BurnMiningV1SigHash,
      testingERC1155.address
    );
    await visionEmitter.newPool(
      erc1155StakeMiningV1SigHash,
      testingERC1155.address
    );
    await visionEmitter.newPool(
      erc721StakeMiningV1SigHash,
      testingERC721.address
    );
    await visionEmitter.newPool(
      initialContributorShareSigHash,
      testingERC1155.address
    );
    erc20BurnMining = ERC20BurnMiningV1__factory.connect(
      await workhard.commons.erc20BurnMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingBurnToken.address
      ),
      deployer
    );
    erc20StakeMining = ERC20StakeMiningV1__factory.connect(
      await workhard.commons.erc20StakeMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingStakeToken.address
      ),
      deployer
    );
    erc721StakeMining = ERC721StakeMiningV1__factory.connect(
      await workhard.commons.erc721StakeMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingERC721.address
      ),
      deployer
    );
    erc1155StakeMining = ERC1155StakeMiningV1__factory.connect(
      await workhard.commons.erc1155StakeMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingERC1155.address
      ),
      deployer
    );
    erc1155BurnMining = ERC1155BurnMiningV1__factory.connect(
      await workhard.commons.erc1155BurnMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingERC1155.address
      ),
      deployer
    );
    initialContributorShare = InitialContributorShare__factory.connect(
      await workhard.commons.initialContributorShareFactory.poolAddress(
        visionEmitter.address,
        testingERC1155.address
      ),
      deployer
    );
    const prepare = async (account: SignerWithAddress) => {
      await testingStakeToken
        .connect(deployer)
        .mint(account.address, parseEther("10000"));
      await testingBurnToken
        .connect(deployer)
        .mint(account.address, parseEther("10000"));
      await testingERC1155
        .connect(deployer)
        .mint(account.address, 0, parseEther("10000"));
      await testingStakeToken
        .connect(account)
        .approve(erc20StakeMining.address, parseEther("10000"));
      await testingBurnToken
        .connect(account)
        .approve(erc20BurnMining.address, parseEther("10000"));
      await testingERC721
        .connect(account)
        .setApprovalForAll(erc721StakeMining.address, true);
      await testingERC1155
        .connect(account)
        .setApprovalForAll(erc1155StakeMining.address, true);
      await testingERC1155
        .connect(account)
        .setApprovalForAll(erc1155BurnMining.address, true);
      await testingERC1155
        .connect(account)
        .setApprovalForAll(initialContributorShare.address, true);
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
    await testingERC721.connect(deployer).mint(alice.address, 0);
    await testingERC721.connect(deployer).mint(alice.address, 1);
    await testingERC721.connect(deployer).mint(alice.address, 2);
    await testingERC721.connect(deployer).mint(bob.address, 3);
    await testingERC721.connect(deployer).mint(bob.address, 4);
    await testingERC721.connect(deployer).mint(bob.address, 5);
    await testingERC721.connect(deployer).mint(carl.address, 6);
    await testingERC721.connect(deployer).mint(carl.address, 7);
    await testingERC721.connect(deployer).mint(carl.address, 8);
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("distribute()", async () => {
    beforeEach(async () => {
      await goToNextWeek();
      await visionEmitter.distribute();
    });
    describe("Stake Mining Pool", async () => {
      it("should return the value depending on the staking period", async () => {
        const bal0 = await vision.balanceOf(alice.address);
        await erc20StakeMining.connect(alice).stake(parseEther("100"));
        await setNextBlockTimestamp(10000);
        await erc20StakeMining.connect(alice).exit();
        const bal1 = await vision.balanceOf(alice.address);
        await erc20StakeMining.connect(alice).stake(parseEther("100"));
        await setNextBlockTimestamp(20000);
        await erc20StakeMining.connect(alice).exit();
        const bal2 = await vision.balanceOf(alice.address);
        expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
      });
      it("should share the reward by the amount of stake", async () => {
        await erc20StakeMining.connect(alice).stake(parseEther("100"));
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await erc20StakeMining.connect(bob).stake(parseEther("100"));
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await erc20StakeMining.connect(carl).stake(parseEther("100"));
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await erc20StakeMining.connect(alice).exit();
        await erc20StakeMining.connect(bob).exit();
        await erc20StakeMining.connect(carl).exit();

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
        await erc20BurnMining.connect(alice).burn(parseEther("100"));
        await setNextBlockTimestamp(10000);
        await erc20BurnMining.connect(alice).exit();
        const bal1 = await vision.balanceOf(alice.address);
        await erc20BurnMining.connect(alice).burn(parseEther("100"));
        await setNextBlockTimestamp(20000);
        await erc20BurnMining.connect(alice).exit();
        const bal2 = await vision.balanceOf(alice.address);
        expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
      });
      it("should share the reward by the amount of burn", async () => {
        await erc20BurnMining.connect(alice).burn(parseEther("100"));
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await erc20BurnMining.connect(bob).burn(parseEther("100"));
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await erc20BurnMining.connect(carl).burn(parseEther("100"));
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await erc20BurnMining.connect(alice).exit();
        await erc20BurnMining.connect(bob).exit();
        await erc20BurnMining.connect(carl).exit();

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
    describe("ERC721 Stake Mining Pool", async () => {
      it("should return the value depending on the staking period", async () => {
        const bal0 = await vision.balanceOf(alice.address);
        await erc721StakeMining.connect(alice).stake(0);
        await setNextBlockTimestamp(10000);
        await erc721StakeMining.connect(alice).exit();
        const bal1 = await vision.balanceOf(alice.address);
        await erc721StakeMining.connect(alice).stake(1);
        await setNextBlockTimestamp(20000);
        await erc721StakeMining.connect(alice).exit();
        const bal2 = await vision.balanceOf(alice.address);
        expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
      });
      it("should share the reward by the amount of stake", async () => {
        await erc721StakeMining.connect(alice).stake(0);
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await erc721StakeMining.connect(bob).stake(3);
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await erc721StakeMining.connect(carl).stake(6);
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await erc721StakeMining.connect(alice).exit();
        await erc721StakeMining.connect(bob).exit();
        await erc721StakeMining.connect(carl).exit();

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
    describe("ERC1155 Stake Mining Pool", async () => {
      it("should return the value depending on the staking period", async () => {
        const bal0 = await vision.balanceOf(alice.address);
        await erc1155StakeMining.connect(alice).stake(0, 5);
        await setNextBlockTimestamp(10000);
        await erc1155StakeMining.connect(alice).exit(0);
        const bal1 = await vision.balanceOf(alice.address);
        await erc1155StakeMining.connect(alice).stake(0, 5);
        await setNextBlockTimestamp(20000);
        await erc1155StakeMining.connect(alice).exit(0);
        const bal2 = await vision.balanceOf(alice.address);
        expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
      });
      it("should share the reward by the amount of stake", async () => {
        await erc1155StakeMining.connect(alice).stake(0, 5);
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await erc1155StakeMining.connect(bob).stake(0, 5);
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await erc1155StakeMining.connect(carl).stake(0, 5);
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await erc1155StakeMining.connect(alice).mine();
        await erc1155StakeMining.connect(bob).mine();
        await erc1155StakeMining.connect(carl).mine();
        await erc1155StakeMining.connect(alice).exit(0);
        await erc1155StakeMining.connect(bob).exit(0);
        await erc1155StakeMining.connect(carl).exit(0);

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
    describe("ERC1155 Burn Mining Pool", async () => {
      it("should return the value depending on the burned period", async () => {
        const bal0 = await vision.balanceOf(alice.address);
        await erc1155BurnMining.connect(alice).burn(0, parseEther("100"));
        await setNextBlockTimestamp(10000);
        await erc1155BurnMining.connect(alice).exit(0);
        const bal1 = await vision.balanceOf(alice.address);
        await erc1155BurnMining.connect(alice).burn(0, parseEther("100"));
        await setNextBlockTimestamp(20000);
        await erc1155BurnMining.connect(alice).exit(0);
        const bal2 = await vision.balanceOf(alice.address);
        expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
      });
      it("should share the reward by the amount of burn", async () => {
        await erc1155BurnMining.connect(alice).burn(0, parseEther("100"));
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await erc1155BurnMining.connect(bob).burn(0, parseEther("100"));
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await erc1155BurnMining.connect(carl).burn(0, parseEther("100"));
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await erc1155BurnMining.connect(alice).exit(0);
        await erc1155BurnMining.connect(bob).exit(0);
        await erc1155BurnMining.connect(carl).exit(0);

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
      it("should return the same result when it uses transfer instead of burn", async () => {
        await testingERC1155
          .connect(alice)
          .safeTransferFrom(
            alice.address,
            erc1155BurnMining.address,
            0,
            parseEther("100"),
            []
          );
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await testingERC1155
          .connect(bob)
          .safeTransferFrom(
            bob.address,
            erc1155BurnMining.address,
            0,
            parseEther("100"),
            []
          );
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await testingERC1155
          .connect(carl)
          .safeTransferFrom(
            carl.address,
            erc1155BurnMining.address,
            0,
            parseEther("100"),
            []
          );
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await erc1155BurnMining.connect(alice).exit(0);
        await erc1155BurnMining.connect(bob).exit(0);
        await erc1155BurnMining.connect(carl).exit(0);

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
  describe("Initial Contributor Share Pool", async () => {
    it("should return the value depending on the burned period", async () => {
      const bal0 = await vision.balanceOf(alice.address);
      await initialContributorShare
        .connect(alice)
        ["burn(uint256)"](parseEther("100"));
      await setNextBlockTimestamp(10000);
      await initialContributorShare.connect(alice)["exit()"]();
      const bal1 = await vision.balanceOf(alice.address);
      await initialContributorShare
        .connect(alice)
        ["burn(uint256)"](parseEther("100"));
      await setNextBlockTimestamp(20000);
      await initialContributorShare.connect(alice)["exit()"]();
      const bal2 = await vision.balanceOf(alice.address);
      expect(bal2.sub(bal1)).eq(bal1.sub(bal0).mul(2));
    });
    it("should share the reward by the amount of burn", async () => {
      await initialContributorShare
        .connect(alice)
        ["burn(uint256)"](parseEther("100"));
      await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
      await initialContributorShare
        .connect(bob)
        ["burn(uint256)"](parseEther("100"));
      await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
      await initialContributorShare
        .connect(carl)
        ["burn(uint256)"](parseEther("100"));
      await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

      await initialContributorShare.connect(alice)["exit()"]();
      await initialContributorShare.connect(bob)["exit()"]();
      await initialContributorShare.connect(carl)["exit()"]();

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
