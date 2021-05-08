import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { goTo, sqrt } from "../../utils/utilities";
import { getMiningFixture, MiningFixture } from "../../../scripts/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe("SquareRootVoteCounter.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let planter: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let deployerAddress: string;
  let planterAddress: string;
  let aliceAddress: string;
  let bobAddress: string;
  let carlAddress: string;
  let fixture: MiningFixture;
  let visionToken: Contract;
  let dividendPool: Contract;
  let voteCounter: Contract;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    planter = signers[1];
    alice = signers[2];
    bob = signers[3];
    carl = signers[4];
    deployerAddress = await deployer.getAddress();
    planterAddress = await planter.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carlAddress = await carl.getAddress();
    fixture = await getMiningFixture({ skipMinterSetting: true });
    visionToken = fixture.visionToken;
    dividendPool = fixture.dividendPool;
    voteCounter = fixture.voteCounter;
    const prepare = async (account: SignerWithAddress) => {
      const addr = await account.getAddress();
      await visionToken.mint(addr, parseEther("10000"));
      await visionToken
        .connect(account)
        .approve(dividendPool.address, parseEther("10000"));
    };
    await prepare(alice);
    await prepare(bob);
    await prepare(carl);
  });
  describe("getVotes()", async () => {
    beforeEach(async () => {
      await dividendPool.connect(alice).stakeAndLock(parseEther("100"), 4);
      await dividendPool.connect(bob).stakeAndLock(parseEther("10"), 40);
      await dividendPool.connect(carl).stakeAndLock(parseEther("100"), 2);
    });
    it("should be proportional to the square root of its dispachable farmers", async () => {
      const epoch = await dividendPool.callStatic.getCurrentEpoch();
      const aliceDispatchableFarmersForNextEpoch = await dividendPool.callStatic.dispatchableFarmers(
        alice.address,
        epoch.add(1)
      );
      const bobDispatchableFarmersForNextEpoch = await dividendPool.callStatic.dispatchableFarmers(
        bob.address,
        epoch.add(1)
      );
      const carlDispatchableFarmersForNextEpoch = await dividendPool.callStatic.dispatchableFarmers(
        carl.address,
        epoch.add(1)
      );
      const aliceVotes = await voteCounter.callStatic.getVotes(alice.address);
      const bobVotes = await voteCounter.callStatic.getVotes(bob.address);
      const carlVotes = await voteCounter.callStatic.getVotes(carl.address);
      expect(aliceVotes).eq(sqrt(aliceDispatchableFarmersForNextEpoch));
      expect(bobVotes).eq(sqrt(bobDispatchableFarmersForNextEpoch));
      expect(carlVotes).eq(sqrt(carlDispatchableFarmersForNextEpoch));
    });
  });
});
