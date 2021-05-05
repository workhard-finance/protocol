import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer } from "ethers";
import { defaultAbiCoder, keccak256, parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../utils/utilities";
import { AppFixture, getAppFixture } from "../../scripts/fixtures";

chai.use(solidity);

describe("StableReserves.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manager: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let cryptoJobBoard: Contract;
  let stableReserves: Contract;
  let commitmentToken: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  let baseCurrency: Contract;
  let project: {
    id: number;
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
    cryptoJobBoard = fixture.cryptoJobBoard;
    commitmentToken = fixture.commitmentToken;
    stableReserves = fixture.stableReserves;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseCurrency.mint(addr, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(cryptoJobBoard.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserves.address, parseEther("10000"));
      await commitmentToken
        .connect(account)
        .approve(stableReserves.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(alice);
    await prepare(bob);
    const description = "helloworld";
    project = {
      id: 0,
      title: "Workhard is firing",
      description: "helloworld",
      uri: "ipfs://MY_PROJECT_URL",
    };
    budget = { currency: baseCurrency.address, amount: parseEther("100") };
    await cryptoJobBoard.connect(projOwner).createProject(project.uri);
    await cryptoJobBoard
      .connect(projOwner)
      .addBudget(project.id, budget.currency, budget.amount);
    await runTimelockTx(
      timelock,
      cryptoJobBoard.populateTransaction.approveProject(project.id)
    );
    await cryptoJobBoard.connect(manager).executeBudget(project.id, 0, []);
  });
  describe("redeem()", async () => {
    beforeEach("compensate", async () => {
      cryptoJobBoard
        .connect(projOwner)
        .compensate(project.id, alice.address, parseEther("1"));
    });
    it("should return the base currency and burn the commitment token", async () => {
      const base0 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm0 = await commitmentToken.callStatic.balanceOf(alice.address);
      expect(stableReserves.connect(alice).redeem(parseEther("1")))
        .to.emit(stableReserves, "Redeemed")
        .withArgs(alice.address, parseEther("1"));
      const base1 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm1 = await commitmentToken.callStatic.balanceOf(alice.address);
      expect(base1.sub(base0)).eq(comm0.sub(comm1));
    });
    it("should not change the remaining budget", async () => {
      const remaining0 = await stableReserves.callStatic.mintable();
      await stableReserves.connect(alice).redeem(parseEther("1"));
      const remaining1 = await stableReserves.callStatic.mintable();
      expect(remaining1).eq(remaining0);
    });
  });
  describe("payInsteadOfWorking()", async () => {
    it("should mint commitment tokens when someone pays twice", async () => {
      const supply0 = await commitmentToken.callStatic.totalSupply();
      const base0 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm0 = await commitmentToken.callStatic.balanceOf(alice.address);
      await stableReserves.connect(alice).payInsteadOfWorking(parseEther("1"));
      const supply1 = await commitmentToken.callStatic.totalSupply();
      const base1 = await baseCurrency.callStatic.balanceOf(alice.address);
      const comm1 = await commitmentToken.callStatic.balanceOf(alice.address);
      expect(base0.sub(base1)).eq(parseEther("2"));
      expect(comm1.sub(comm0)).eq(parseEther("1"));
      expect(supply1.sub(supply0)).eq(parseEther("1"));
    });
    it("should increase the commitment token budget", async () => {
      const remaining0 = await stableReserves.callStatic.mintable();
      await stableReserves.connect(alice).payInsteadOfWorking(parseEther("1"));
      const remaining1 = await stableReserves.callStatic.mintable();
      expect(remaining1.sub(remaining0)).eq(parseEther("1"));
    });
  });
  describe("grant()", async () => {
    it("should grant commitment token for project", async () => {
      await stableReserves.connect(bob).payInsteadOfWorking(parseEther("1"));
      const remaining0 = await stableReserves.callStatic.mintable();
      expect(remaining0).not.eq(BigNumber.from(0));
      const budget0 = await cryptoJobBoard.callStatic.projectFund(project.id);
      await runTimelockTx(
        timelock,
        stableReserves.populateTransaction.grant(
          cryptoJobBoard.address,
          remaining0,
          defaultAbiCoder.encode(["uint256"], [project.id])
        )
      );
      const remaining1 = await stableReserves.callStatic.mintable();
      const budget1 = await cryptoJobBoard.callStatic.projectFund(project.id);
      expect(remaining1).eq(BigNumber.from(0));
      expect(budget1.sub(budget0)).eq(remaining0);
    });
  });
});
