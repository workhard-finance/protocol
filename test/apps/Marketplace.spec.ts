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
  let stableReserves: Contract;
  let commitmentToken: Contract;
  let baseCurrency: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manufacturer = signers[1];
    alice = signers[1];
    bob = signers[2];
    fixture = await getAppFixture();
    baseCurrency = fixture.baseCurrency;
    commitmentToken = fixture.commitmentToken;
    marketplace = fixture.marketplace;
    stableReserves = fixture.stableReserves;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseCurrency.mint(addr, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserves.address, parseEther("10000"));
      await stableReserves
        .connect(account)
        .payInsteadOfWorking(parseEther("100"));
      commitmentToken
        .connect(account)
        .approve(marketplace.address, parseEther("10000"));
    };
    await prepare(manufacturer);
    await prepare(alice);
    await prepare(bob);
  });
  describe("launchNewProduct()", async () => {
    const PRICE_IN_COMMITMENT_TOKEN = parseEther("1");
    const PROFIT_FOR_MANUFACTURER = 1000;
    const BASE_URI = "ipfscid";
    const PROJ_ID = BigNumber.from(
      keccak256(solidityPack(["string"], [BASE_URI]))
    );
    it("anyone can buy the NFT by paying Commitment token", async () => {
      await expect(
        marketplace
          .connect(alice)
          .manufacture(
            BASE_URI,
            PROFIT_FOR_MANUFACTURER,
            PRICE_IN_COMMITMENT_TOKEN
          )
      )
        .to.emit(marketplace, "NewProduct")
        .withArgs(PROJ_ID, alice.address, BASE_URI);
      await expect(
        marketplace.connect(bob).buy(PROJ_ID, bob.address, 3)
      ).to.emit(marketplace, "TransferSingle");
    });
  });
});
