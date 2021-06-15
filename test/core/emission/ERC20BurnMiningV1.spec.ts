import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import {
  goTo,
  goToNextWeek,
  setNextBlockTimestamp,
} from "../../utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ERC20BurnMiningV1,
  ERC20BurnMiningV1__factory,
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

describe("ERC20BurnMiningV1.sol", function () {
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
  let testingBurnToken: ERC20;
  let erc20BurnMining: ERC20BurnMiningV1;
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
    testingBurnToken = await new ERC20__factory(deployer).deploy();
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
    erc20BurnMining = ERC20BurnMiningV1__factory.connect(
      await workhard.commons.erc20BurnMiningV1Factory.poolAddress(
        visionEmitter.address,
        testingBurnToken.address
      ),
      deployer
    );
    const prepare = async (account: SignerWithAddress) => {
      await testingBurnToken
        .connect(deployer)
        .mint(account.address, parseEther("10000"));
      await testingBurnToken
        .connect(account)
        .approve(erc20BurnMining.address, parseEther("10000"));
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
  });
});
