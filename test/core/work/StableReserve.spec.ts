import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer, BigNumberish } from "ethers";
import {
  defaultAbiCoder,
  keccak256,
  parseEther,
  solidityKeccak256,
} from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../../utils/utilities";
import { AppFixture, getAppFixture } from "../../../scripts/fixtures";

chai.use(solidity);

describe("StableReserve.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manager: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let jobBoard: Contract;
  let stableReserve: Contract;
  let commitToken: Contract;
  let dividendPool: Contract;
  let timelock: Contract;
  let baseCurrency: Contract;
  let project: {
    id: BigNumberish;
    title: string;
    description: string;
    uri: string;
  };
  let budget: {
    currency: string;
    amount: BigNumber;
  };
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manager = signers[1];
    projOwner = signers[2];
    alice = signers[3];
    bob = signers[4];
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    fixture = await getAppFixture();
    baseCurrency = fixture.baseCurrency;
    jobBoard = fixture.jobBoard;
    commitToken = fixture.commitToken;
    stableReserve = fixture.stableReserve;
    dividendPool = fixture.dividendPool;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseCurrency.mint(addr, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(jobBoard.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await commitToken
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(alice);
    await prepare(bob);
    const description = "helloworld";
    const uri = "ipfs://MY_PROJECT_URL";
    project = {
      id: BigNumber.from(
        solidityKeccak256(["string", "address"], [uri, projOwner.address])
      ),
      title: "Workhard is firing",
      description: "helloworld",
      uri: "ipfs://MY_PROJECT_URL",
    };
    budget = { currency: baseCurrency.address, amount: parseEther("100") };
    await jobBoard.connect(projOwner).createProject(project.uri);
    await jobBoard
      .connect(projOwner)
      .addBudget(project.id, budget.currency, budget.amount);
    await runTimelockTx(
      timelock,
      jobBoard.populateTransaction.approveProject(project.id)
    );
    await jobBoard.connect(manager).executeBudget(project.id, 0, []);
  });
  describe("redeem()", async () => {
    beforeEach("compensate", async () => {
      jobBoard
        .connect(projOwner)
        .compensate(project.id, alice.address, parseEther("1"));
    });
    it("should return the base currency and burn the commit token", async () => {
      const base0 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm0 = await commitToken.callStatic.balanceOf(alice.address);
      expect(stableReserve.connect(alice).redeem(parseEther("1")))
        .to.emit(stableReserve, "Redeemed")
        .withArgs(alice.address, parseEther("1"));
      const base1 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm1 = await commitToken.callStatic.balanceOf(alice.address);
      expect(base1.sub(base0)).eq(comm0.sub(comm1));
    });
    it("should not change the remaining budget", async () => {
      const remaining0 = await stableReserve.callStatic.mintable();
      await stableReserve.connect(alice).redeem(parseEther("1"));
      const remaining1 = await stableReserve.callStatic.mintable();
      expect(remaining1).eq(remaining0);
    });
  });
  describe("payInsteadOfWorking()", async () => {
    it("should mint commit tokens when someone pays twice", async () => {
      const supply0 = await commitToken.callStatic.totalSupply();
      const base0 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm0 = await commitToken.callStatic.balanceOf(alice.address);
      await stableReserve.connect(alice).payInsteadOfWorking(parseEther("1"));
      const supply1 = await commitToken.callStatic.totalSupply();
      const base1 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm1 = await commitToken.callStatic.balanceOf(alice.address);
      expect(base0.sub(base1)).eq(parseEther("2"));
      expect(comm1.sub(comm0)).eq(parseEther("1"));
      expect(supply1.sub(supply0)).eq(parseEther("1"));
    });
    it("should increase the commit token budget", async () => {
      const remaining0 = await stableReserve.callStatic.mintable();
      await stableReserve.connect(alice).payInsteadOfWorking(parseEther("1"));
      const remaining1 = await stableReserve.callStatic.mintable();
      expect(remaining1.sub(remaining0)).eq(parseEther("1"));
    });
  });
  describe("grant()", async () => {
    it("should grant commit token for project", async () => {
      await stableReserve.connect(bob).payInsteadOfWorking(parseEther("1"));
      const remaining0 = await stableReserve.callStatic.mintable();
      expect(remaining0).not.eq(BigNumber.from(0));
      const budget0 = await jobBoard.callStatic.projectFund(project.id);
      await runTimelockTx(
        timelock,
        stableReserve.populateTransaction.grant(
          jobBoard.address,
          remaining0,
          defaultAbiCoder.encode(["uint256"], [project.id])
        )
      );
      const remaining1 = await stableReserve.callStatic.mintable();
      const budget1 = await jobBoard.callStatic.projectFund(project.id);
      expect(remaining1).eq(BigNumber.from(0));
      expect(budget1.sub(budget0)).eq(remaining0);
    });
  });
});
