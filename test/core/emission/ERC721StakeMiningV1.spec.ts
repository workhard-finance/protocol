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
  ERC721,
  ERC721__factory,
  ERC721StakeMiningV1,
  ERC721StakeMiningV1__factory,
  DAO,
  Workhard,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("ERC721StakeMiningV1.sol", function () {
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
  let testingERC721: ERC721;
  let erc721StakeMining: ERC721StakeMiningV1;
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
    testingERC721 = await new ERC721__factory(deployer).deploy();
    const erc721StakeMiningV1SigHash =
      await workhard.commons.erc721StakeMiningV1Factory.poolType();
    await visionEmitter.newPool(
      erc721StakeMiningV1SigHash,
      testingERC721.address
    );
    erc721StakeMining = ERC721StakeMiningV1__factory.connect(
      await workhard.commons.erc721StakeMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingERC721.address
      ),
      deployer
    );
    const prepare = async (account: SignerWithAddress) => {
      await testingERC721
        .connect(account)
        .setApprovalForAll(erc721StakeMining.address, true);
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
                await workhard.commons.erc721StakeMiningV1Factory.poolType(),
              baseToken: testingERC721.address,
            },
          ],
          treasuryWeight: 500,
          callerWeight: 1,
        })
      );
      await goToNextWeek();
      await visionEmitter.distribute();
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
