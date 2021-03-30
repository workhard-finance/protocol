import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer } from "ethers";
import { defaultAbiCoder, keccak256, parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { runTimelockTx } from "../utils/utilities";
import { AppFixture, getAppFixture } from "../../scripts/fixtures";

chai.use(solidity);

describe("CryptoJobBoard.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manager: SignerWithAddress;
  let projOwner: SignerWithAddress;
  let alice: SignerWithAddress;
  let fixture: AppFixture;
  let projManager: Contract;
  let cryptoJobBoard: Contract;
  let commitmentToken: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  let stableCoin: Contract;
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
    const ERC20 = await ethers.getContractFactory("TestERC20");
    fixture = await getAppFixture();
    stableCoin = fixture.stableCoin;
    projManager = fixture.projManager;
    commitmentToken = fixture.commitmentToken;
    cryptoJobBoard = fixture.cryptoJobBoard;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    await stableCoin.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await stableCoin.mint(addr, parseEther("10000"));
      await stableCoin
        .connect(account)
        .approve(projManager.address, parseEther("10000"));
      await stableCoin
        .connect(account)
        .approve(cryptoJobBoard.address, parseEther("10000"));
      commitmentToken
        .connect(account)
        .approve(cryptoJobBoard.address, parseEther("10000"));
    };
    await prepare(projOwner);
    await prepare(alice);
    await runTimelockTx(
      timelock,
      projManager.populateTransaction.setManager(manager.address, true)
    );
    const description = "helloworld";
    const projId = keccak256(
      defaultAbiCoder.encode(
        ["address", "string"],
        [projOwner.address, description]
      )
    );
    project = {
      id: 0,
      title: "Workhard is firing",
      description: "helloworld",
      uri: "ipfs://MY_PROJECT_URL",
    };
    budget = { currency: stableCoin.address, amount: parseEther("100") };
    await projManager
      .connect(projOwner)
      .createProject(project.title, project.description, project.uri);
    await projManager
      .connect(projOwner)
      .addBudget(project.id, budget.currency, budget.amount);
    await runTimelockTx(
      timelock,
      projManager.populateTransaction.approveProject(project.id)
    );
    await projManager.connect(manager).approveBudget(project.id, 0, []);
  });
  describe("compensate()", async () => {
    it("the budget owner can execute the budget", async () => {
      const bal0: BigNumber = await commitmentToken.callStatic.balanceOf(
        alice.address
      );
      await expect(
        cryptoJobBoard
          .connect(projOwner)
          .compensate(project.id, alice.address, parseEther("1"))
      )
        .to.emit(cryptoJobBoard, "Payed")
        .withArgs(project.id, alice.address, parseEther("1"));
      const bal1: BigNumber = await commitmentToken.callStatic.balanceOf(
        alice.address
      );
      expect(bal1.sub(bal0)).eq(parseEther("1"));
    });
  });
  describe("redeem()", async () => {
    beforeEach("compensate", async () => {
      cryptoJobBoard
        .connect(projOwner)
        .compensate(project.id, alice.address, parseEther("1"));
    });
    it("should return the base currency and burn the commitment token", async () => {
      const base0 = await stableCoin.callStatic.balanceOf(alice.address);
      const comm0 = await commitmentToken.callStatic.balanceOf(alice.address);
      expect(cryptoJobBoard.connect(alice).redeem(parseEther("1")))
        .to.emit(cryptoJobBoard, "Redeemed")
        .withArgs(alice.address, parseEther("1"));
      const base1 = await stableCoin.callStatic.balanceOf(alice.address);
      const comm1 = await commitmentToken.callStatic.balanceOf(alice.address);
      expect(base1.sub(base0)).eq(comm0.sub(comm1));
    });
    it("should not change the remaining budget", async () => {
      const remaining0 = await cryptoJobBoard.callStatic.remainingBudget();
      await cryptoJobBoard.connect(alice).redeem(parseEther("1"));
      const remaining1 = await cryptoJobBoard.callStatic.remainingBudget();
      expect(remaining1).eq(remaining0);
    });
  });
  describe("payInsteadOfWorking()", async () => {
    it("should mint commitment tokens when someone pays twice", async () => {
      const supply0 = await commitmentToken.callStatic.totalSupply();
      const base0 = await stableCoin.callStatic.balanceOf(alice.address);
      const comm0 = await commitmentToken.callStatic.balanceOf(alice.address);
      await cryptoJobBoard.connect(alice).payInsteadOfWorking(parseEther("1"));
      const supply1 = await commitmentToken.callStatic.totalSupply();
      const base1 = await stableCoin.callStatic.balanceOf(alice.address);
      const comm1 = await commitmentToken.callStatic.balanceOf(alice.address);
      expect(base0.sub(base1)).eq(parseEther("2"));
      expect(comm1.sub(comm0)).eq(parseEther("1"));
      expect(supply1.sub(supply0)).eq(parseEther("1"));
    });
    it("should increase the commitment token budget", async () => {
      const remaining0 = await cryptoJobBoard.callStatic.remainingBudget();
      await cryptoJobBoard.connect(alice).payInsteadOfWorking(parseEther("1"));
      const remaining1 = await cryptoJobBoard.callStatic.remainingBudget();
      expect(remaining1.sub(remaining0)).eq(parseEther("1"));
    });
  });
});
