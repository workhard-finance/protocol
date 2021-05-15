import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { keccak256, parseEther, solidityPack } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AppFixture, getAppFixture } from "../../scripts/fixtures";
import {
  COMMIT,
  DividendPool,
  ERC20Mock,
  Marketplace,
  StableReserve,
  TimelockedGovernance,
} from "../../src";
import { runTimelockTx } from "../utils/utilities";

chai.use(solidity);

describe("Marketplace.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manufacturer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let marketplace: Marketplace;
  let stableReserve: StableReserve;
  let commit: COMMIT;
  let baseCurrency: ERC20Mock;
  let dividendPool: DividendPool;
  let timelock: TimelockedGovernance;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manufacturer = signers[1];
    alice = signers[1];
    bob = signers[2];
    fixture = await getAppFixture();
    baseCurrency = fixture.baseCurrency;
    commit = fixture.commit;
    marketplace = fixture.marketplace;
    stableReserve = fixture.stableReserve;
    dividendPool = fixture.dividendPool;
    timelock = fixture.timelock;
    await runTimelockTx(
      timelock,
      dividendPool.populateTransaction.addToken(commit.address)
    );
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: SignerWithAddress) => {
      await baseCurrency.mint(account.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await stableReserve
        .connect(account)
        .payInsteadOfWorking(parseEther("100"));
      commit.connect(account).approve(marketplace.address, parseEther("10000"));
    };
    await prepare(manufacturer);
    await prepare(alice);
    await prepare(bob);
  });
  describe("launchNewProduct()", async () => {
    it("anyone can buy the NFT by paying Commit token", async () => {
      const PRICE_IN_COMMIT_TOKEN = parseEther("1");
      const PROFIT_FOR_MANUFACTURER = 1000;
      const BASE_URI = "ipfscid";
      const PROJ_ID = BigNumber.from(
        keccak256(
          solidityPack(["string", "address"], [BASE_URI, alice.address])
        )
      );
      await expect(
        marketplace
          .connect(alice)
          .manufacture(BASE_URI, PROFIT_FOR_MANUFACTURER, PRICE_IN_COMMIT_TOKEN)
      )
        .to.emit(marketplace, "NewProduct")
        .withArgs(PROJ_ID, alice.address, BASE_URI);
      await expect(
        marketplace.connect(bob).buy(PROJ_ID, bob.address, 3)
      ).to.emit(marketplace, "TransferSingle");
    });
  });
});
