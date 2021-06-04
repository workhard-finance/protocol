import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, BigNumberish } from "ethers";
import {
  defaultAbiCoder,
  parseEther,
  solidityKeccak256,
} from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../../utils/utilities";
import {
  COMMIT,
  DividendPool,
  ERC20,
  ERC20__factory,
  ContributionBoard,
  StableReserve,
  TimelockedGovernance,
  Workhard,
  WorkhardClient,
  WorkhardDAO,
} from "../../../src";
import { getWorkhard } from "../../../scripts/fixtures";

chai.use(solidity);

describe("StableReserve.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manager: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let client: WorkhardClient;
  let workhard: Workhard;
  let masterDAO: WorkhardDAO;
  let contributionBoard: ContributionBoard;
  let stableReserve: StableReserve;
  let commit: COMMIT;
  let dividendPool: DividendPool;
  let timelock: TimelockedGovernance;
  let baseCurrency: ERC20;
  let projId: BigNumber;
  let project: {
    title: string;
    description: string;
    uri: string;
  };
  let budget: {
    currency: string;
    amount: BigNumber;
  };
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manager = signers[1];
    projOwner = signers[2];
    alice = signers[3];
    bob = signers[4];
    client = await getWorkhard();
    workhard = client.workhard;
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
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: SignerWithAddress) => {
      await baseCurrency.mint(account.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(contributionBoard.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await commit
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await commit
        .connect(account)
        .approve(contributionBoard.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(alice);
    await prepare(bob);
    project = {
      title: "Workhard is firing",
      description: "helloworld",
      uri: "ipfs://MY_PROJECT_URL",
    };
    await workhard.connect(projOwner).createProject(0, project.uri);
    projId = await workhard.tokenByIndex((await workhard.totalSupply()).sub(1));
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("payInsteadOfWorking()", async () => {
    it("should mint commit tokens when someone pays twice", async () => {
      const supply0 = await commit.totalSupply();
      const base0 = await baseCurrency.balanceOf(alice.address);
      const comm0 = await commit.balanceOf(alice.address);
      await stableReserve.connect(alice).payInsteadOfWorking(parseEther("1"));
      const supply1 = await commit.totalSupply();
      const base1 = await baseCurrency.balanceOf(alice.address);
      const comm1 = await commit.balanceOf(alice.address);
      expect(base0.sub(base1)).eq(parseEther("2"));
      expect(comm1.sub(comm0)).eq(parseEther("1"));
      expect(supply1.sub(supply0)).eq(parseEther("1"));
    });
    it("should increase the commit token budget", async () => {
      const remaining0 = await stableReserve.mintable();
      await stableReserve.connect(alice).payInsteadOfWorking(parseEther("1"));
      const remaining1 = await stableReserve.mintable();
      expect(remaining1.sub(remaining0)).eq(parseEther("1"));
    });
  });
  describe("redeem()", async () => {
    beforeEach("redeem", async () => {
      await stableReserve
        .connect(projOwner)
        .payInsteadOfWorking(parseEther("2"));
      await contributionBoard
        .connect(projOwner)
        .addProjectFund(projId, parseEther("1"));
      await contributionBoard
        .connect(projOwner)
        .compensate(projId, alice.address, parseEther("1"));
    });
    it("should return the base currency and burn the commit token", async () => {
      const base0 = await baseCurrency.balanceOf(alice.address);
      const comm0 = await commit.balanceOf(alice.address);
      await expect(stableReserve.connect(alice).redeem(parseEther("1")))
        .to.emit(stableReserve, "Redeemed")
        .withArgs(alice.address, parseEther("1"));
      const base1 = await baseCurrency.balanceOf(alice.address);
      const comm1 = await commit.balanceOf(alice.address);
      expect(base1.sub(base0)).eq(comm0.sub(comm1));
    });
    it("should not change the remaining budget", async () => {
      const remaining0 = await stableReserve.mintable();
      await stableReserve.connect(alice).redeem(parseEther("1"));
      const remaining1 = await stableReserve.mintable();
      expect(remaining1).eq(remaining0);
    });
  });
  describe("grant()", async () => {
    it("should grant commit token for project", async () => {
      await stableReserve.connect(bob).payInsteadOfWorking(parseEther("1"));
      const remaining0 = await stableReserve.mintable();
      expect(remaining0).not.eq(BigNumber.from(0));
      const budget0 = await contributionBoard.projectFund(projId);
      await runTimelockTx(
        timelock,
        stableReserve.populateTransaction.grant(
          contributionBoard.address,
          remaining0,
          defaultAbiCoder.encode(["uint256"], [projId])
        )
      );
      const remaining1 = await stableReserve.mintable();
      const budget1 = await contributionBoard.projectFund(projId);
      expect(remaining1).eq(BigNumber.from(0));
      expect(budget1.sub(budget0)).eq(remaining0);
    });
  });
});
