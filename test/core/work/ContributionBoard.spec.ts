import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { defaultAbiCoder, parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { goToNextWeek, runTimelockTx } from "../../utils/utilities";
import {
  COMMIT,
  DividendPool,
  ERC20,
  ContributionBoard,
  Project,
  StableReserve,
  TimelockedGovernance,
  DAO,
  ERC20__factory,
  IERC1620,
} from "../../../src";
import { defaultDAOParam, getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("ContributionBoard.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let masterDAO: DAO;
  let contributionBoard: ContributionBoard;
  let stableReserve: StableReserve;
  let commit: COMMIT;
  let project: Project;
  let baseCurrency: ERC20;
  let dividendPool: DividendPool;
  let sablier: IERC1620;
  let timelock: TimelockedGovernance;
  let projectMetadata: {
    id: BigNumber;
    title: string;
    description: string;
    uri: string;
  };
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    projOwner = signers[1];
    alice = signers[2];
    bob = signers[3];
    const client = await getWorkhard();
    project = client.project;
    masterDAO = await client.getMasterDAO({ account: deployer });
    baseCurrency = ERC20__factory.connect(
      masterDAO.baseCurrency.address,
      deployer
    );

    contributionBoard = masterDAO.contributionBoard;
    commit = masterDAO.commit;
    stableReserve = masterDAO.stableReserve;
    dividendPool = masterDAO.dividendPool;
    timelock = masterDAO.timelock;
    sablier = client.commons.sablier;
    await runTimelockTx(
      timelock,
      stableReserve.populateTransaction.allow(contributionBoard.address, true)
    );
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: SignerWithAddress) => {
      await baseCurrency.mint(account.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(contributionBoard.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await stableReserve
        .connect(account)
        .payInsteadOfWorking(parseEther("5000"));
      await commit
        .connect(account)
        .approve(contributionBoard.address, parseEther("5000"));
    };
    await prepare(projOwner);
    await prepare(alice);
    await prepare(bob);
    const uri = "MY_PROJECT_URL";
    projectMetadata = {
      id: BigNumber.from(1),
      title: "Workhard is hiring",
      description: "helloworld",
      uri,
    };
    await project.connect(projOwner).createProject(0, projectMetadata.uri);
  });
  let snapshot: string;

  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("addProjectFund()", async () => {
    it("should increase the fund amount", async () => {
      await contributionBoard
        .connect(alice)
        .addProjectFund(1, parseEther("100"));
      expect(await contributionBoard.projectFund(1)).to.eq(parseEther("100"));
    });
    it("should increase the commit balance", async () => {
      const prevBal = await commit.balanceOf(contributionBoard.address);
      await contributionBoard
        .connect(alice)
        .addProjectFund(1, parseEther("100"));
      const newBal = await commit.balanceOf(contributionBoard.address);
      expect(newBal.sub(prevBal)).to.eq(parseEther("100"));
    });
    describe("before startInitialContributorShareProgram()", () => {
      it("should not record contribution", async () => {
        await expect(
          contributionBoard.connect(alice).addProjectFund(1, parseEther("100"))
        ).not.to.emit(contributionBoard, "TransferSingle");
        expect(await contributionBoard.balanceOf(alice.address, 1)).to.eq(0);
      });
      describe("initialContributorShareProgram()", () => {
        it("should return false", async () => {
          expect(await contributionBoard.initialContributorShareProgram(1)).to
            .be.false;
        });
      });
    });
    describe("after startInitialContributorShareProgram()", () => {
      beforeEach(async () => {
        await contributionBoard
          .connect(projOwner)
          .startInitialContributorShareProgram(1, 1000, parseEther("1000"));
      });
      describe("getContributors()", () => {
        it("should add funders to the contributors list", async () => {
          expect(await contributionBoard.getContributors(1)).to.deep.eq([]);
          await contributionBoard
            .connect(alice)
            .addProjectFund(1, parseEther("100"));
          expect(await contributionBoard.getContributors(1)).to.deep.eq([
            alice.address,
          ]);
        });
      });
      describe("initialContributorShareProgram()", () => {
        it("should return true", async () => {
          expect(await contributionBoard.initialContributorShareProgram(1)).to
            .be.true;
        });
      });
      it("should return true for minimum share rate", async () => {
        expect(await contributionBoard.minimumShare(1)).not.to.eq(0);
      });
      it("should have minimum share rate", async () => {
        expect(await contributionBoard.minimumShare(1)).not.to.eq(0);
      });
      it("should record contribution once the project starts initial contributor share program", async () => {
        expect(await contributionBoard.balanceOf(alice.address, 1)).to.eq(0);
        expect(await contributionBoard.totalSupplyOf(1)).to.eq(0);
        await expect(
          contributionBoard.connect(alice).addProjectFund(1, parseEther("100"))
        ).to.emit(contributionBoard, "TransferSingle");
        expect(await contributionBoard.balanceOf(alice.address, 1)).to.eq(
          parseEther("100")
        );
        expect(await contributionBoard.totalSupplyOf(1)).to.eq(
          parseEther("100")
        );
      });
      it("should be reverted if the funding amount is too much", async () => {
        await expect(
          contributionBoard.connect(alice).addProjectFund(1, parseEther("2000"))
        ).to.be.revertedWith(
          "Exceeds the max supply. Set a new max supply value."
        );
      });
      it("should share more than its committed minimum share once it starts the token emission", async () => {
        await expect(
          project
            .connect(projOwner)
            .upgradeToDAO(
              1,
              defaultDAOParam(projOwner.address, baseCurrency.address)
            )
        ).to.be.revertedWith(
          "founder share should be greater than the committed minimum share"
        );
        await expect(
          project.connect(projOwner).upgradeToDAO(1, {
            ...defaultDAOParam(projOwner.address, baseCurrency.address),
            founderShare: 1000,
          })
        ).not.to.be.revertedWith(
          "founder share should be greater than the committed minimum share"
        );
      });
    });
  });
  describe("setMaxContribution()", async () => {
    beforeEach(async () => {
      await contributionBoard
        .connect(projOwner)
        .startInitialContributorShareProgram(1, 1000, parseEther("1000"));
      await contributionBoard
        .connect(alice)
        .addProjectFund(1, parseEther("1000"));
    });
    it("should update the max supply value", async () => {
      expect(await contributionBoard.maxSupplyOf(1)).to.eq(parseEther("1000"));
    });
    it("should not be able to pay or get fund once it reaches the max contribution", async () => {
      await expect(
        contributionBoard.connect(alice).addProjectFund(1, parseEther("1"))
      ).to.be.revertedWith(
        "Exceeds the max supply. Set a new max supply value."
      );
      await expect(
        contributionBoard
          .connect(projOwner)
          .compensate(1, alice.address, parseEther("1"))
      ).to.be.reverted;
    });
    it("should be able to pay or get fund after increasing the max contribution", async () => {
      await contributionBoard
        .connect(projOwner)
        .setMaxContribution(1, parseEther("2000"));
      await expect(
        contributionBoard.connect(alice).addProjectFund(1, parseEther("1"))
      ).not.to.be.revertedWith(
        "Exceeds the max supply. Set a new max supply value."
      );
      await expect(
        contributionBoard
          .connect(projOwner)
          .compensate(1, alice.address, parseEther("1"))
      ).not.to.be.reverted;
    });
  });
  describe("pauseFunding()", async () => {
    describe("fundingPaused()", () => {
      it("should return false before pauseFunding() is called", async () => {
        expect(await contributionBoard.fundingPaused(1)).to.be.false;
      });
      it("should return true after pauseFunding() is called", async () => {
        await contributionBoard.connect(projOwner).pauseFunding(1);
        expect(await contributionBoard.fundingPaused(1)).to.be.true;
      });
    });
    it("should not be able to add fund to the project when the funding is paused", async () => {
      await contributionBoard
        .connect(alice)
        .addProjectFund(1, parseEther("2000"));
      await contributionBoard.connect(projOwner).pauseFunding(1);
      await expect(
        contributionBoard.connect(alice).addProjectFund(1, parseEther("1000"))
      ).to.be.revertedWith("Should resume funding");
    });
  });
  describe("resumeFunding()", async () => {
    it("should be able to add fund to the project when the funding is resumed", async () => {
      await contributionBoard
        .connect(alice)
        .addProjectFund(1, parseEther("1000"));
      await contributionBoard.connect(projOwner).pauseFunding(1);
      await expect(
        contributionBoard.connect(alice).addProjectFund(1, parseEther("1000"))
      ).to.be.revertedWith("Should resume funding");
      await contributionBoard.connect(projOwner).resumeFunding(1);
      await expect(
        contributionBoard.connect(alice).addProjectFund(1, parseEther("1000"))
      ).not.to.be.reverted;
    });
  });
  describe("compensate()", async () => {
    beforeEach(async () => {
      await contributionBoard
        .connect(projOwner)
        .startInitialContributorShareProgram(1, 1000, parseEther("2000"));
      await contributionBoard
        .connect(alice)
        .addProjectFund(1, parseEther("1000"));
    });
    it("should pay at once to the contributor", async () => {
      const prevBal = await commit.balanceOf(alice.address);
      await contributionBoard
        .connect(projOwner)
        .compensate(1, alice.address, parseEther("1"));
      const newBal = await commit.balanceOf(alice.address);
      expect(newBal.sub(prevBal)).to.eq(parseEther("1"));
    });
    it("should record the contribution", async () => {
      const prevBal = await contributionBoard.balanceOf(alice.address, 1);
      await contributionBoard
        .connect(projOwner)
        .compensate(1, alice.address, parseEther("1"));
      const newBal = await contributionBoard.balanceOf(alice.address, 1);
      expect(newBal.sub(prevBal)).to.eq(parseEther("1"));
    });
    describe("getContributors()", () => {
      it("should add the workers to the contributors list", async () => {
        expect(await contributionBoard.getContributors(1)).not.to.contain(
          bob.address
        );
        await contributionBoard
          .connect(projOwner)
          .compensate(1, bob.address, parseEther("1"));
        expect(await contributionBoard.getContributors(1)).to.contain(
          bob.address
        );
      });
    });
  });
  describe("compensateInStream()", async () => {
    let month = 86400 * 7 * 4;
    let amount = parseEther("100").div(month).mul(month);
    let startTime: number;
    beforeEach(async () => {
      await contributionBoard
        .connect(projOwner)
        .startInitialContributorShareProgram(1, 1000, parseEther("2000"));
      await contributionBoard
        .connect(projOwner)
        .addProjectFund(1, parseEther("1000"));
      expect(await contributionBoard.getStreams(1)).to.deep.eq([]);
      await contributionBoard
        .connect(projOwner)
        .compensateInStream(1, alice.address, amount, 86400 * 7 * 4);
      startTime = (await ethers.provider.getBlock("latest")).timestamp;
      goToNextWeek();
    });
    describe("getStreams()", () => {
      it("should return all sablier streams", async () => {
        expect(await contributionBoard.getStreams(1)).to.have.length(1);
      });
      describe("projectOf()", () => {
        it("should return the project id where the stream belongs to.", async () => {
          const [stream] = await contributionBoard.getStreams(1);
          expect(await contributionBoard.projectOf(stream)).to.eq(1);
        });
      });
    });
    describe("getContributors()", () => {
      it("should add the workers to the contributors list", async () => {
        expect(await contributionBoard.getContributors(1)).not.to.contain(
          bob.address
        );
        await contributionBoard
          .connect(projOwner)
          .compensateInStream(1, bob.address, amount, 86400 * 7 * 4);
        expect(await contributionBoard.getContributors(1)).to.contain(
          bob.address
        );
      });
    });

    it("should be able to claim via sablier", async () => {
      const [stream] = await contributionBoard.getStreams(1);
      await expect(
        sablier.connect(alice).withdrawFromStream(stream, parseEther("25"))
      ).not.to.be.reverted;
      // remove..
      await contributionBoard.connect(projOwner).cancelStream(1, stream);
    });
    it("should not claim more", async () => {
      const [stream] = await contributionBoard.getStreams(1);
      await expect(
        sablier.connect(alice).withdrawFromStream(stream, parseEther("26"))
      ).to.be.reverted;
    });
    it("should record the contribution", async () => {
      expect(await contributionBoard.balanceOf(alice.address, 1)).to.eq(amount);
    });
    describe("cancelStream()", async () => {
      it("should return the remaining balance and also burn the contribution for the canceled period.", async () => {
        expect(await contributionBoard.balanceOf(alice.address, 1)).to.eq(
          amount
        );
        const [stream] = await contributionBoard.getStreams(1);
        await contributionBoard.connect(projOwner).cancelStream(1, stream);
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        expect(await contributionBoard.balanceOf(alice.address, 1)).to.eq(
          amount.div(month).mul(timestamp - startTime)
        );
      });
      it("should transfer the earned balance to the recipient.", async () => {
        const prevBal = await commit.balanceOf(alice.address);
        const [stream] = await contributionBoard.getStreams(1);
        await contributionBoard.connect(projOwner).cancelStream(1, stream);
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const newBal = await commit.balanceOf(alice.address);
        expect(newBal.sub(prevBal)).to.eq(
          amount.div(month).mul(timestamp - startTime)
        );
      });
    });
  });

  describe("recordContribution()", async () => {
    it("only the project owner can execute this function.", async () => {
      await expect(
        contributionBoard
          .connect(alice)
          .recordContribution(alice.address, 1, parseEther("100"))
      ).to.be.revertedWith("Not authorized");
    });
    it("should record contribution before its get finalized.", async () => {
      await contributionBoard
        .connect(projOwner)
        .recordContribution(alice.address, 1, parseEther("100"));
      expect(await contributionBoard.balanceOf(alice.address, 1)).to.eq(
        parseEther("100")
      );
    });
    it("should not be able to record contributions after the initial contributor share program starts.", async () => {
      await contributionBoard
        .connect(projOwner)
        .startInitialContributorShareProgram(1, 1000, parseEther("1000"));
      await expect(
        contributionBoard
          .connect(projOwner)
          .recordContribution(alice.address, 1, parseEther("100"))
      ).to.be.revertedWith(
        "Once it starts to get funding, you cannot record additional contribution"
      );
    });
  });
  describe("finalize()", async () => {
    describe("fianlized()", () => {
      it("should return false before the project is upgraded to a DAO", async () => {
        expect(await contributionBoard.finalized(1)).to.be.false;
      });
      it("should return true after the project is upgraded to a DAO", async () => {
        await project
          .connect(projOwner)
          .upgradeToDAO(
            1,
            defaultDAOParam(projOwner.address, baseCurrency.address)
          );
        await project.connect(projOwner).launch(1, 4750, 4750, 499, 1);
        expect(await contributionBoard.finalized(1)).to.be.true;
      });
    });
    describe("transfer()", async () => {
      beforeEach(async () => {
        await contributionBoard
          .connect(projOwner)
          .addProjectFund(1, parseEther("100"));
        await contributionBoard
          .connect(projOwner)
          .compensate(1, alice.address, parseEther("100"));
      });
      it("cannot transfer the initial contributors share tokens before the finalization", async () => {
        await expect(
          contributionBoard
            .connect(alice)
            .safeTransferFrom(
              alice.address,
              bob.address,
              1,
              parseEther("100"),
              []
            )
        ).to.be.revertedWith("Not finalized");
      });
      it("can transfer the initial contributors share tokens after the finalization", async () => {
        await project
          .connect(projOwner)
          .upgradeToDAO(
            1,
            defaultDAOParam(projOwner.address, baseCurrency.address)
          );
        await project.connect(projOwner).launch(1, 4750, 4750, 499, 1);
        await expect(
          contributionBoard
            .connect(alice)
            .safeTransferFrom(
              alice.address,
              bob.address,
              1,
              parseEther("100"),
              []
            )
        ).not.to.be.reverted;
      });
    });
  });
  describe("receiveGrant()", async () => {
    it("should increase the fund for the given project id.", async () => {
      const prevFund = await contributionBoard.projectFund(1);
      await runTimelockTx(
        timelock,
        stableReserve.populateTransaction.grant(
          contributionBoard.address,
          parseEther("100"),
          defaultAbiCoder.encode(["uint256"], [1])
        )
      );
      const newFund = await contributionBoard.projectFund(1);
      expect(newFund.sub(prevFund)).to.eq(parseEther("100"));
    });
  });
  describe("getters", async () => {
    describe("sablier()", () => {
      it("should return sablier address", async () => {
        expect(await contributionBoard.sablier()).to.eq(sablier.address);
      });
    });
    describe("project()", () => {
      it("should return project address", async () => {
        expect(await contributionBoard.project()).to.eq(project.address);
      });
    });
    describe("uri()", () => {
      it("should return sablier address", async () => {
        expect(await contributionBoard.uri(1)).to.eq(
          `ipfs://${projectMetadata.uri}`
        );
      });
    });
  });
});
