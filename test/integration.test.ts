import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, constants } from "ethers";
import { defaultAbiCoder, formatEther, parseEther } from "ethers/lib/utils";
import {
  almostEquals,
  goTo,
  goToNextWeek,
  runTimelockTx,
  runOnly,
} from "./utils/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Project,
  Workhard,
  DAO,
  IERC20__factory,
  Periphery,
  TimelockedGovernance,
} from "../src";
import { getWorkhard } from "../scripts/fixtures";

chai.use(solidity);

const day = 86400;

const getTimestamp = async () =>
  (await ethers.provider.getBlock("latest")).timestamp;

describe("Work Hard Finance Integrated Test", function () {
  let signers: SignerWithAddress[];
  let masterMultiSig: SignerWithAddress;
  let distributor: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let david: SignerWithAddress;
  let eric: SignerWithAddress;
  let fred: SignerWithAddress;
  let george: SignerWithAddress;
  let workhard: Workhard;
  let project: Project;
  let masterDAO: DAO;
  let snapshot: string;
  let startTimestamp: number;

  const getDay = async () => {
    return Math.floor(((await getTimestamp()) - startTimestamp) / day);
  };

  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  before(async () => {
    signers = await ethers.getSigners();
    masterMultiSig = signers[0];
    distributor = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    david = signers[5];
    eric = signers[6];
    fred = signers[7];
    george = signers[8];
    workhard = await getWorkhard();
    project = workhard.project.connect(masterMultiSig);
    masterDAO = await workhard.getMasterDAO();
    // give 10000 DAIs
    await Promise.all(
      [alice, bob, carl, david, eric].map((account) =>
        masterDAO.baseCurrency
          .connect(masterMultiSig)
          .mint(account.address, parseEther("10000"))
      )
    );
  });
  // this will ignore the transactions during the each unittest

  let firstWeekDistribution: BigNumber;
  describe("Alice calls the first distribute() function", () => {
    runOnly(this, async () => {
      firstWeekDistribution = await masterDAO.visionEmitter.emission();
      await expect(masterDAO.visionEmitter.connect(alice).distribute()).to.be
        .reverted;
      // can run after 1 week
      await goToNextWeek();
      startTimestamp = await getTimestamp();
      await expect(masterDAO.visionEmitter.connect(alice).distribute()).not.to
        .be.reverted;
    });
    it("should give alice the caller reward.", async () => {
      expect(await masterDAO.vision.balanceOf(alice.address)).to.be.gt(0);
    });
    it("bob & carl should have 0 for their VISION balance at first.", async () => {
      expect(await masterDAO.vision.balanceOf(bob.address)).to.eq(0);
      expect(await masterDAO.vision.balanceOf(carl.address)).to.eq(0);
    });
  });
  describe("Alice lock her VISION", () => {
    runOnly(this, async () => {
      const aliceBal = await masterDAO.vision.balanceOf(alice.address);
      await masterDAO.vision
        .connect(alice)
        .approve(masterDAO.votingEscrow.address, constants.MaxUint256);
      // lock for 4 weeks
      await masterDAO.votingEscrow
        .connect(alice)
        .createLock(aliceBal.div(4), 4);
      // lock for 1 week
      await masterDAO.votingEscrow
        .connect(alice)
        .createLock(aliceBal.div(4), 1);
    });
    it("should increase alice's right balance", async () => {
      expect(await masterDAO.right.totalSupply()).not.to.eq(0);
      let aliceRightBal = await masterDAO.right.balanceOf(alice.address);
      let aliceLock0Bal = await masterDAO.right.balanceOfLock(
        await masterDAO.votingEscrow.tokenOfOwnerByIndex(alice.address, 0)
      );
      let aliceLock1Bal = await masterDAO.right.balanceOfLock(
        await masterDAO.votingEscrow.tokenOfOwnerByIndex(alice.address, 1)
      );
      expect(aliceRightBal).to.eq(aliceLock0Bal.add(aliceLock1Bal));
      await goToNextWeek();
      almostEquals(
        await masterDAO.right.balanceOf(alice.address),
        await masterDAO.right.totalSupply()
      );
      expect(await masterDAO.right.balanceOf(alice.address)).to.lte(
        await masterDAO.right.totalSupply()
      );
      // await masterDAO.right.connect(alice)["checkpoint(uint256)"](10);
      await goTo(86400 * 7);
      almostEquals(
        await masterDAO.right.balanceOf(alice.address),
        await masterDAO.right.totalSupply()
      );
      expect(await masterDAO.right.balanceOf(alice.address)).to.lte(
        await masterDAO.right.totalSupply()
      );
    });
  });
  describe("Bob distributes DAI to the dividend pool for testing. Alice should be possible to receive it for the next week", () => {
    runOnly(this, async () => {
      await masterDAO.baseCurrency
        .connect(bob)
        .approve(masterDAO.dividendPool.address, constants.MaxUint256);
      await masterDAO.dividendPool
        .connect(bob)
        .distribute(masterDAO.baseCurrency.address, parseEther("1000"));
    });
    it("Alice should be possible to receive them after 1 week", async () => {
      let aliceBal = await masterDAO.baseCurrency.balanceOf(alice.address);
      await goToNextWeek();
      await masterDAO.dividendPool
        .connect(alice)
        .claim(masterDAO.baseCurrency.address);
      almostEquals(
        (await masterDAO.baseCurrency.balanceOf(alice.address)).sub(aliceBal),
        parseEther("1000")
      );
    });
  });
  describe("Bob buys 500 $COMMITs at a premium", () => {
    let prevBal;
    runOnly(this, async () => {
      prevBal = await masterDAO.baseCurrency.balanceOf(bob.address);
      await masterDAO.baseCurrency
        .connect(bob)
        .approve(masterDAO.stableReserve.address, parseEther("10000"));
      await masterDAO.stableReserve
        .connect(bob)
        .payInsteadOfWorking(parseEther("500"));
    });
    it("should spend 1000 DAI", async () => {
      expect(
        prevBal.sub(await masterDAO.baseCurrency.balanceOf(bob.address))
      ).to.eq(parseEther("1000"));
    });
    it("should have 500 extra DAI in the Stable Reserve", async () => {
      expect(await masterDAO.stableReserve.mintable()).to.eq(parseEther("500"));
    });
    it("COMMIT total supply = 500", async () => {
      expect(await masterDAO.commit.totalSupply()).to.eq(parseEther("500"));
    });
  });
  const startLiquidityMining = async (
    proj: number,
    account: SignerWithAddress,
    visionAmount: BigNumber,
    ethAmount?: BigNumber
  ) => {
    const periphery = await workhard.getPeriphery(proj);
    const dao = await workhard.getDAO(proj);
    const { visionLP } = periphery;
    const token0 = await visionLP.token0();
    const token1 = await visionLP.token1();
    const wethAddress = token0 !== dao.vision.address ? token0 : token1;
    const visionReserved = await IERC20__factory.connect(
      dao.vision.address,
      ethers.provider
    ).balanceOf(visionLP.address);
    const wethReserved = await IERC20__factory.connect(
      wethAddress,
      ethers.provider
    ).balanceOf(visionLP.address);
    let ethToAdd =
      ethAmount || visionAmount.mul(wethReserved).div(visionReserved);
    const WETH = await ethers.getContractAt("WETH9", wethAddress);
    await WETH.connect(account).deposit({ value: ethToAdd });
    await WETH.connect(account).transfer(visionLP.address, ethToAdd);
    await dao.vision.connect(account).approve(visionLP.address, visionAmount);
    await dao.vision.connect(account).transfer(visionLP.address, visionAmount);
    await visionLP.connect(account).mint(account.address);
    const lpAmount = await periphery.visionLP.balanceOf(alice.address);
    await periphery.visionLP
      .connect(alice)
      .approve(periphery.liquidityMining.address, constants.MaxUint256);
    await periphery.liquidityMining
      .connect(alice)
      .stake(await periphery.visionLP.balanceOf(alice.address));
    return lpAmount;
  };
  describe("Alice starts liquidity mining.", () => {
    let lpAmount: BigNumber;
    runOnly(this, async () => {
      const aliceVisionBal = await masterDAO.vision.balanceOf(alice.address);
      lpAmount = await startLiquidityMining(
        0,
        alice,
        aliceVisionBal.div(2),
        parseEther("1")
      );
      const periphery = await workhard.getPeriphery(0);
    });
    it("should increase the dispatched miners", async () => {
      const periphery = await workhard.getPeriphery(0);
      expect(
        await periphery.liquidityMining.dispatchedMiners(alice.address)
      ).to.be.eq(lpAmount);
    });
  });
  describe("Bob starts Commit Mining.", () => {
    runOnly(this, async () => {
      const periphery = await workhard.getPeriphery(0);
      await masterDAO.commit
        .connect(bob)
        .approve(periphery.commitMining.address, constants.MaxUint256);
      await periphery.commitMining.connect(bob).burn(parseEther("500"));
    });
    it("should increase stable reserve's extra dai to 1000", async () => {
      expect(await masterDAO.stableReserve.mintable()).to.eq(
        parseEther("1000")
      );
    });
  });
  describe("After 3 days.", () => {
    runOnly(this, async () => {
      await goTo(day * 3);
    });
    it("Alice should have 3/7 of the 1st week emission for the liquidity mining", async () => {
      const periphery = await workhard.getPeriphery(0);
      almostEquals(
        firstWeekDistribution.mul(4750).div(10818).div(7).mul(3),
        await periphery.liquidityMining.mined(alice.address)
      );
    });
    it("Bob should have 3/7 of the 1st week emission for the commitment mining", async () => {
      const periphery = await workhard.getPeriphery(0);
      almostEquals(
        firstWeekDistribution.mul(4750).div(10818).div(7).mul(3),
        await periphery.commitMining.mined(bob.address)
      );
    });
  });
  describe("Carl starts a project with ICSP.", () => {
    runOnly(this, async () => {
      await workhard.project.connect(carl).createProject(0, "uri");
      await masterDAO.contributionBoard
        .connect(carl)
        .startInitialContributorShareProgram(1, 500, parseEther("1000"));
    });
    it("should set master dao for its parent DAO", async () => {
      expect(await workhard.project.daoOf(1)).to.eq(0);
      expect(await workhard.project.projectsOfDAOByIndex(0, 0)).to.eq(1);
    });
    it("should not accept too much fund", async () => {
      await masterDAO.baseCurrency
        .connect(eric)
        .approve(masterDAO.stableReserve.address, constants.MaxUint256);
      await masterDAO.commit
        .connect(eric)
        .approve(masterDAO.contributionBoard.address, constants.MaxUint256);
      await masterDAO.stableReserve
        .connect(eric)
        .payInsteadOfWorking(parseEther("2000"));
      await expect(
        masterDAO.contributionBoard
          .connect(eric)
          .addProjectFund(1, parseEther("1001"))
      ).to.be.reverted;
      await expect(
        masterDAO.contributionBoard
          .connect(eric)
          .addProjectFund(1, parseEther("1000"))
      ).not.to.be.reverted;
    });
  });
  describe("David and Eric funds to Carl's project.", () => {
    runOnly(this, async () => {
      const buyCommitAndFund = async (
        account: SignerWithAddress,
        amountOfCommit: BigNumber
      ) => {
        await masterDAO.baseCurrency
          .connect(account)
          .approve(masterDAO.stableReserve.address, constants.MaxUint256);
        await masterDAO.commit
          .connect(account)
          .approve(masterDAO.contributionBoard.address, constants.MaxUint256);
        await masterDAO.stableReserve
          .connect(account)
          .payInsteadOfWorking(amountOfCommit);
        await masterDAO.contributionBoard
          .connect(account)
          .addProjectFund(1, amountOfCommit);
      };
      await buyCommitAndFund(david, parseEther("200"));
      await buyCommitAndFund(eric, parseEther("400"));
    });
    it("should increase David & Eric's initial contributors share proportional to the funded amount", async () => {
      const davidShare = await masterDAO.contributionBoard.balanceOf(
        david.address,
        1
      );
      const ericShare = await masterDAO.contributionBoard.balanceOf(
        eric.address,
        1
      );
      expect(davidShare).not.to.eq(0);
      expect(ericShare).not.to.eq(0);
      expect(davidShare.mul(2)).to.eq(ericShare);
    });
    it("should increase the Stable Reserve's extra DAI", async () => {
      expect(await masterDAO.stableReserve.mintable()).to.eq(
        parseEther("1600")
      );
    });
    it("should increase the fund for the project", async () => {
      expect(await masterDAO.contributionBoard.projectFund(1)).to.eq(
        parseEther("600")
      );
    });
  });
  describe("Community gives grants to Carl's project.", () => {
    runOnly(this, async () => {
      await runTimelockTx(
        masterDAO.timelock.connect(masterMultiSig),
        masterDAO.stableReserve.populateTransaction.grant(
          masterDAO.contributionBoard.address,
          parseEther("1000"),
          defaultAbiCoder.encode(["uint256"], [1])
        )
      );
    });
    it("should not affect ICSP", async () => {
      expect(await masterDAO.contributionBoard.totalSupplyOf(1)).to.eq(
        parseEther("600")
      );
    });
    it("should increase the project fund to 1600", async () => {
      expect(await masterDAO.contributionBoard.projectFund(1)).to.eq(
        parseEther("1600")
      );
    });
    it("should decrease the mintable amount of Stable Reserve to 600", async () => {
      expect(await masterDAO.stableReserve.mintable()).to.eq(parseEther("600"));
    });
    it("should be day 4 after the timelock tx", async () => {
      expect(await getDay()).to.eq(4);
    });
  });
  describe("Carl, Fred, and George work for Carl's project and get paid in $COMMITs", () => {
    runOnly(this, async () => {
      await masterDAO.contributionBoard
        .connect(carl)
        .setMaxContribution(1, parseEther("3000"));
      await masterDAO.contributionBoard
        .connect(carl)
        .compensate(1, carl.address, parseEther("500"));
      await masterDAO.contributionBoard
        .connect(carl)
        .compensate(1, fred.address, parseEther("500"));
      await masterDAO.contributionBoard
        .connect(carl)
        .compensate(1, george.address, parseEther("500"));
    });
    it("should increase Carl, Fred, and George's initial contributor share", async () => {
      const carlShare = await masterDAO.contributionBoard.balanceOf(
        carl.address,
        1
      );
      const fredShare = await masterDAO.contributionBoard.balanceOf(
        fred.address,
        1
      );
      const georgeShare = await masterDAO.contributionBoard.balanceOf(
        george.address,
        1
      );
      expect(carlShare).not.to.eq(0);
      expect(carlShare).to.eq(fredShare);
      expect(carlShare).to.eq(georgeShare);
      expect(carlShare).to.eq(parseEther("500"));
    });
  });
  describe("Carl decides to upgrade the projct as a DAO", () => {
    runOnly(this, async () => {
      const param = {
        multisig: carl.address, // just for testing
        treasury: carl.address, // just for testing
        baseCurrency: masterDAO.baseCurrency.address,
        projectName: "Forked Project",
        projectSymbol: "FP",
        visionName: "Forked Project VISION",
        visionSymbol: "vFP",
        commitName: "FP COMMIT",
        commitSymbol: "cFP",
        rightName: "FP RIGHT",
        rightSymbol: "cRP",
        emissionStartDelay: 0,
        minDelay: day,
        voteLaunchDelay: day,
        initialEmission: parseEther("10000"),
        minEmissionRatePerWeek: 100,
        emissionCutRate: 1000,
        founderShare: 500,
      };
      await expect(
        project.connect(carl).upgradeToDAO(1, { ...param, founderShare: 400 })
      ).to.be.reverted;
      await expect(project.connect(carl).upgradeToDAO(1, param)).not.to.be
        .reverted;
      await project.connect(carl).launch(1, 4750, 4750, 499, 1);
    });
    it("should launch a new DAO", async () => {
      const forkedDAO = await workhard.getDAO(1);
      expect(forkedDAO.commit).not.to.eq(constants.AddressZero);
    });
    it("forked DAO is not a project of master DAO anymore.", async () => {
      expect(await project.projectsOf(0)).to.eq(0);
    });
  });
  describe("Carl, Fred, and George starts commit mining for WHF with earned $COMMITs", () => {
    runOnly(this, async () => {
      const periphery = await workhard.getPeriphery(0);
      const startCommitMining = async (
        account: SignerWithAddress,
        amount: BigNumber
      ) => {
        await masterDAO.commit
          .connect(account)
          .approve(periphery.commitMining.address, constants.MaxUint256);
        await periphery.commitMining.connect(account).burn(amount);
      };
      await startCommitMining(carl, parseEther("300"));
      await startCommitMining(fred, parseEther("300"));
      await startCommitMining(george, parseEther("300"));
    });
    it("should increase the mintable amount of Stable Reserve to 1500", async () => {
      expect(await masterDAO.stableReserve.mintable()).to.eq(
        parseEther("1500")
      );
    });
  });
  describe("Alice starts liquidity mining for Carl's project", () => {
    runOnly(this, async () => {
      const forkedDAO = await workhard.getDAO(1);
      await forkedDAO.visionEmitter.connect(alice).distribute();
      const visionBal = await forkedDAO.vision.balanceOf(alice.address);
      await startLiquidityMining(1, alice, visionBal.div(2), parseEther("1"));
    });
    it("should increase forked project liquidity minining supply", async () => {
      const forkedDAOPeriphey = await workhard.getPeriphery(1);
      expect(await forkedDAOPeriphey.liquidityMining.totalMiners()).not.to.eq(
        0
      );
      expect(await forkedDAOPeriphey.commitMining.totalMiners()).to.eq(0);
    });
  });
  describe("The forked project can use the remaining fund using the multisig", () => {
    let prevTotal: BigNumber;
    let prevDaveCommitBal: BigNumber;
    runOnly(this, async () => {
      prevTotal = await masterDAO.contributionBoard.totalSupplyOf(1);
      prevDaveCommitBal = await masterDAO.commit.balanceOf(david.address);
      expect(await masterDAO.contributionBoard.projectFund(1)).to.eq(
        parseEther("100")
      );
      const forkedDAO = await workhard.getDAO(1);
      await runTimelockTx(
        forkedDAO.timelock.connect(carl), // using carl's account instead of multisig for testing
        masterDAO.contributionBoard.populateTransaction.compensate(
          1,
          david.address,
          parseEther("100")
        )
      );
    });
    it("should not mint the initial contributor share no more once it's upgraded to a DAO", async () => {
      expect(await masterDAO.contributionBoard.totalSupplyOf(1)).to.eq(
        prevTotal
      );
    });
    it("should give the fund to the recipient successfully", async () => {
      expect(await masterDAO.commit.balanceOf(david.address)).to.eq(
        prevDaveCommitBal.add(parseEther("100"))
      );
    });
    it("should be day 5 after the timelock tx", async () => {
      expect(await getDay()).to.eq(5);
    });
  });
  describe("Bob starts commit mining for Carl's project", () => {
    runOnly(this, async () => {
      const { commit } = await workhard.getDAO(1);
      const { commitMining } = await workhard.getPeriphery(1);
      await commit
        .connect(bob)
        .approve(commitMining.address, constants.MaxUint256);
      await commitMining.connect(bob).burn(parseEther("500"));
    });
  });
  describe("Alice does liquidity mining for 3 days for Carl's project", async () => {
    let beforeAliceVisionVal: BigNumber;
    runOnly(this, async () => {
      const periphery = await workhard.getPeriphery(1);
      beforeAliceVisionVal = await periphery.liquidityMining.mined(
        alice.address
      );
      await goTo(day * 3);
    });
    it("mined additional liquidity", async () => {
      const periphery = await workhard.getPeriphery(1);
      const afterAliceVisionVal = await periphery.liquidityMining.mined(
        alice.address
      );
      expect(afterAliceVisionVal.sub(beforeAliceVisionVal)).to.be.gt(0);
    });
    it("burn current liquidity", async () => {
      const periphery = await workhard.getPeriphery(1);
      const forkedDAO = await workhard.getDAO(1);
      const beforeAliceVisionAmount = await forkedDAO.vision.balanceOf(
        alice.address
      );
      const beforeMined = await periphery.liquidityMining.mined(alice.address);
      await periphery.liquidityMining.connect(alice).exit();
      const afterAliceVisionAmount = await forkedDAO.vision.balanceOf(
        alice.address
      );
      const afterMined = await periphery.liquidityMining.mined(alice.address);
      almostEquals(
        afterAliceVisionAmount.sub(beforeAliceVisionAmount),
        beforeMined.sub(afterMined)
      );
      expect(afterMined).is.eq(BigNumber.from(0));
    });
  });
  describe("Commit Mining", async () => {
    describe("Bob starts commit mining for Carl's project", () => {
      let periphery: Periphery, forkedDAO: DAO;
      runOnly(this, async () => {
        periphery = await workhard.getPeriphery(1);
        forkedDAO = await workhard.getDAO(1);
        await forkedDAO.commit
          .connect(bob)
          .approve(periphery.commitMining.address, constants.MaxUint256);
        await forkedDAO.commit
          .connect(bob)
          .approve(forkedDAO.stableReserve.address, constants.MaxUint256);
        await forkedDAO.baseCurrency
          .connect(bob)
          .approve(periphery.commitMining.address, constants.MaxUint256);
        await forkedDAO.baseCurrency
          .connect(bob)
          .approve(forkedDAO.stableReserve.address, constants.MaxUint256);
        await forkedDAO.stableReserve
          .connect(bob)
          .payInsteadOfWorking(parseEther("1000"));
        goTo(day * 7);
      });
      it("bob should take 1000 $COMMIT", async () => {
        expect(await forkedDAO.commit.balanceOf(bob.address)).to.eq(
          parseEther("1000")
        );
      });
      it("mintable should be 1000", async () => {
        expect(await forkedDAO.stableReserve.mintable()).to.eq(
          parseEther("1000")
        );
      });
      it("bob should take vision token", async () => {
        const mintable = await periphery.commitMining.mined(bob.address);
        await periphery.commitMining.connect(bob).burn(parseEther("500"));
        almostEquals(await forkedDAO.vision.balanceOf(bob.address), mintable);
        expect(await periphery.commitMining.mined(bob.address)).is.eq(
          BigNumber.from(0)
        );
      });
    });
  });
  describe("Stable Reserve", () => {
    runOnly(this, async () => {
      const forkedDAO = await workhard.getDAO(1);
      await forkedDAO.stableReserve
        .connect(bob)
        .payInsteadOfWorking(parseEther("1000"));
    });

    it("Bob successfully redeem his commit", async () => {
      const forkedDAO = await workhard.getDAO(1);
      const beforeBaseCurrencyBobHas = await forkedDAO.baseCurrency.balanceOf(
        bob.address
      );
      expect(await forkedDAO.commit.balanceOf(bob.address)).to.be.gt(0);
      await forkedDAO.stableReserve.connect(bob).redeem(parseEther("1000"));
      const afterBaseCurrencyBobHas = await forkedDAO.baseCurrency.balanceOf(
        bob.address
      );
      expect(afterBaseCurrencyBobHas.sub(beforeBaseCurrencyBobHas)).to.be.eq(
        parseEther("1000")
      );
    });
  });
  describe("Project A", () => {
    describe("Start new project A", async () => {
      it("successfully add project", async () => {
        const projectMetadata = {
          title: "ProjectA",
          description: "Project A",
          uri: "ipfs://MY_PROJECT_URL",
        };
        const projectsCountBefore = await project.projectsOf(1);
        await project.connect(bob).createProject(1, projectMetadata.uri);
        const projectsCountAfter = await project.projectsOf(1);
        expect(projectsCountAfter.sub(projectsCountBefore)).to.be.eq(1);
      });
    });
    describe("Raise fund", () => {
      it("successfully add new funds", async () => {
        const forkedDAO = await workhard.getDAO(1);
        const projectAId = (await project.projectsOf(1)).add(1);
        await forkedDAO.commit
          .connect(bob)
          .approve(forkedDAO.contributionBoard.address, constants.MaxUint256);
        await forkedDAO.contributionBoard
          .connect(bob)
          .addProjectFund(projectAId, parseEther("1"));
        expect(
          await forkedDAO.contributionBoard.projectFund(projectAId)
        ).to.be.eq(parseEther("1"));
      });
      it("successfully grand to new projects", async () => {
        const forkedDAO = await workhard.getDAO(1);
        const projectAId = (await project.projectsOf(1)).add(1);
        const beforeCommit = await forkedDAO.commit.balanceOf(
          forkedDAO.contributionBoard.address
        );
        const prevFund = await forkedDAO.contributionBoard.projectFund(
          projectAId
        );
        await runTimelockTx(
          forkedDAO.timelock.connect(carl),
          forkedDAO.stableReserve
            .connect(carl)
            .populateTransaction.grant(
              forkedDAO.contributionBoard.address,
              parseEther("2"),
              defaultAbiCoder.encode(["uint256"], [projectAId.toNumber()])
            )
        );
        const afterCommit = await forkedDAO.commit.balanceOf(
          forkedDAO.contributionBoard.address
        );
        const newFund = await forkedDAO.contributionBoard.projectFund(
          projectAId
        );
        expect(newFund.sub(prevFund)).to.eq(parseEther("2"));
        expect(afterCommit.sub(beforeCommit)).to.eq(parseEther("2"));
      });
      it("should be reverted without issue new commitment", async () => {
        const forkedDAO = await workhard.getDAO(1);
        const projectAId = (await project.projectsOf(1)).add(1);
        const beforeCommit = await forkedDAO.commit.balanceOf(
          forkedDAO.contributionBoard.address
        );
        const prevFund = await forkedDAO.contributionBoard.projectFund(
          projectAId
        );

        await expect(
          runTimelockTx(
            forkedDAO.timelock.connect(carl),
            forkedDAO.stableReserve.connect(carl).populateTransaction.grant(
              forkedDAO.contributionBoard.address,
              parseEther("2"),
              defaultAbiCoder.encode(
                ["uint256"],
                [projectAId.add(999).toNumber()]
              ) //wrong project id
            )
          )
        ).to.be.reverted;
        const afterCommit = await forkedDAO.commit.balanceOf(
          forkedDAO.contributionBoard.address
        );
        const newFund = await forkedDAO.contributionBoard.projectFund(
          projectAId
        );
        const newFundWrong = await forkedDAO.contributionBoard.projectFund(
          projectAId.add(999)
        );
        expect(newFund.sub(prevFund)).to.eq(0);
        expect(newFundWrong).to.eq(0);
        expect(afterCommit.sub(beforeCommit)).to.eq(0);
      });
    });
    describe("Do work", () => {
      it("successfully give some fund to worker", async () => {
        // project.
        const forkedDAO = await workhard.getDAO(1);
        const projectAId = (await project.projectsOf(1)).add(1);
        const beforeAliceAmountOfCommit = await forkedDAO.commit.balanceOf(
          alice.address
        );
        await forkedDAO.contributionBoard
          .connect(bob)
          .compensate(projectAId, alice.address, parseEther("1"));
        const afterAliceAmountOfCommit = await forkedDAO.commit.balanceOf(
          alice.address
        );

        expect(
          afterAliceAmountOfCommit.sub(beforeAliceAmountOfCommit)
        ).to.be.eq(parseEther("1"));
        // await forkedDAO.contributionBoard.connect(bob).g
      });

      it("cannot give some fund to worker with not project owner", async () => {
        const forkedDAO = await workhard.getDAO(1);
        const projectAId = (await project.projectsOf(1)).add(1);
        await expect(
          forkedDAO.contributionBoard
            .connect(alice)
            .compensate(projectAId, alice.address, parseEther("1"))
        ).to.be.reverted;
      });
    });
    describe("Upgrade to a DAO", () => {});
    describe("Emission Check", () => {});
    describe("Dividends", () => {});
  });
  describe("Project B", () => {
    describe("Fork and launch immediately", () => {});
  });
  describe("Project C", () => {
    describe("A child DAO of Project B", () => {});
  });
});
