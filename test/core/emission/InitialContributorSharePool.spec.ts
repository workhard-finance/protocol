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
  TimelockedGovernance,
  VISION,
  VisionEmitter,
  ERC1155,
  ERC1155__factory,
  DAO,
  Workhard,
  InitialContributorShare,
  InitialContributorShare__factory,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("InitialContributorSharePool.sol", function () {
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
  let testingERC1155: ERC1155;
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
    testingERC1155 = await new ERC1155__factory(deployer).deploy();
    const initialContributorShareSigHash =
      await workhard.commons.initialContributorShareFactory.poolType();
    await visionEmitter.newPool(
      initialContributorShareSigHash,
      testingERC1155.address
    );
    initialContributorShare = InitialContributorShare__factory.connect(
      await workhard.commons.initialContributorShareFactory.poolAddress(
        visionEmitter.address,
        testingERC1155.address
      ),
      deployer
    );
    const prepare = async (account: SignerWithAddress) => {
      await testingERC1155
        .connect(deployer)
        .mint(account.address, 0, parseEther("10000"));
      await testingERC1155
        .connect(account)
        .setApprovalForAll(initialContributorShare.address, true);
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
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
      await runTimelockTx(
        timelock,
        visionEmitter.populateTransaction.setEmission({
          pools: [
            {
              weight: 4745,
              poolType:
                await workhard.commons.erc20BurnMiningV1Factory.poolType(),
              baseToken: masterDAO.commit.address,
            },
            {
              weight: 4745,
              poolType:
                await workhard.commons.initialContributorShareFactory.poolType(),
              baseToken: testingERC1155.address,
            },
          ],
          treasuryWeight: 500,
          callerWeight: 1,
        })
      );
      await goToNextWeek();
      await visionEmitter.distribute();
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
      it("should return the same result when it uses transfer instead of burn", async () => {
        await testingERC1155
          .connect(alice)
          .safeTransferFrom(
            alice.address,
            initialContributorShare.address,
            0,
            parseEther("100"),
            []
          );
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await testingERC1155
          .connect(bob)
          .safeTransferFrom(
            bob.address,
            initialContributorShare.address,
            0,
            parseEther("100"),
            []
          );
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await testingERC1155
          .connect(carl)
          .safeTransferFrom(
            carl.address,
            initialContributorShare.address,
            0,
            parseEther("100"),
            []
          );
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
      it("should return the same result when it uses batchTransfer instead of burn", async () => {
        await testingERC1155
          .connect(alice)
          .safeBatchTransferFrom(
            alice.address,
            initialContributorShare.address,
            [0],
            [parseEther("100")],
            []
          );
        await goTo(10000); // 100 : 0 : 0 => 100 : 0 : 0
        await testingERC1155
          .connect(bob)
          .safeTransferFrom(
            bob.address,
            initialContributorShare.address,
            0,
            parseEther("100"),
            []
          );
        await goTo(10000); // 50 : 50 : 0 => 150 : 50 : 0
        await testingERC1155
          .connect(carl)
          .safeTransferFrom(
            carl.address,
            initialContributorShare.address,
            0,
            parseEther("100"),
            []
          );
        await goTo(10000); // 33 : 33 : 33 => 183 : 83 : 33

        await initialContributorShare.connect(alice)["exit()"]();
        await initialContributorShare.connect(bob)["exit()"]();
        await initialContributorShare.connect(carl)["exit()"]();

        const aliceReward = await vision.balanceOf(alice.address);
        const bobReward = await vision.balanceOf(bob.address);
        const carlReward = await vision.balanceOf(carl.address);
        expect(aliceReward).not.to.eq(0);
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
