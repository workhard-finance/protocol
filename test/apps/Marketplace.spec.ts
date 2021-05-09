import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer, BigNumber } from "ethers";
import { keccak256, parseEther, solidityPack } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AppFixture, getAppFixture } from "../../scripts/fixtures";

chai.use(solidity);

describe("Marketplace.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manufacturer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let marketplace: Contract;
  let stableReserve: Contract;
  let commitToken: Contract;
  let baseCurrency: Contract;
  let dividendPool: Contract;
  let timelock: Contract;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manufacturer = signers[1];
    alice = signers[1];
    bob = signers[2];
    fixture = await getAppFixture();
    baseCurrency = fixture.baseCurrency;
    commitToken = fixture.commitToken;
    marketplace = fixture.marketplace;
    stableReserve = fixture.stableReserve;
    dividendPool = fixture.dividendPool;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseCurrency.mint(addr, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await stableReserve
        .connect(account)
        .payInsteadOfWorking(parseEther("100"));
      commitToken
        .connect(account)
        .approve(marketplace.address, parseEther("10000"));
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
