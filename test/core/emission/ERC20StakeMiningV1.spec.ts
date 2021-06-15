import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { parseEther } from "ethers/lib/utils";
import {
  goTo,
  goToNextWeek,
  setNextBlockTimestamp,
} from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ERC20StakeMiningV1,
  ERC20StakeMiningV1__factory,
  TimelockedGovernance,
  VISION,
  VisionEmitter,
  DAO,
  Workhard,
  ERC20__factory,
  ERC20,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("ERC20StakeMiningV1.sol", function () {
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
  let erc20StakeMining: ERC20StakeMiningV1;
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
    const erc20StakeMiningV1SigHash =
      await workhard.commons.erc20StakeMiningV1Factory.poolType();
    await visionEmitter.newPool(
      erc20StakeMiningV1SigHash,
      testingStakeToken.address
    );
    erc20StakeMining = ERC20StakeMiningV1__factory.connect(
      await workhard.commons.erc20StakeMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingStakeToken.address
      ),
      deployer
    );
    const prepare = async (account: SignerWithAddress) => {
      await testingStakeToken
        .connect(deployer)
        .mint(account.address, parseEther("10000"));
      await testingStakeToken
        .connect(account)
        .approve(erc20StakeMining.address, parseEther("10000"));
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
  });
});
