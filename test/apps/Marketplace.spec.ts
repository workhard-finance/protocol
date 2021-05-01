import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, Signer, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
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
  let productFactory: Contract;
  let commitmentFund: Contract;
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
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    fixture = await getAppFixture();
    baseCurrency = fixture.baseCurrency;
    commitmentToken = fixture.commitmentToken;
    marketplace = fixture.marketplace;
    productFactory = fixture.productFactory;
    commitmentFund = fixture.commitmentFund;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelock;
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseCurrency.mint(addr, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(commitmentFund.address, parseEther("10000"));
      await commitmentFund
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
    const PRODUCT_NAME = "Workhard Contributors NFT";
    const PRODUCT_SYMBOL = "WNFT";
    const PRICE_IN_COMMITMENT_TOKEN = parseEther("1");
    const PROFIT_FOR_MANUFACTURER = 1000;
    const INITIAL_STOCK = 10;
    const BASE_URI = "https://storage.workhard.finance/";
    const DESCRIPTION = "some plain text";
    let product: Contract;
    beforeEach("should create a new NFT contract", async () => {
      const receipt = await marketplace
        .connect(alice)
        .launchNewProduct(
          PRODUCT_NAME,
          PRODUCT_SYMBOL,
          BASE_URI,
          DESCRIPTION,
          PROFIT_FOR_MANUFACTURER,
          PRICE_IN_COMMITMENT_TOKEN,
          INITIAL_STOCK
        );
      const logs = (await receipt.wait()).logs;
      const ProductFactory = await ethers.getContractFactory("ProductFactory");
      let productAddress: string;
      logs
        .filter((log) => productFactory.address === log.address)
        .forEach((log) => {
          const parsed = ProductFactory.interface.parseLog(log);
          productAddress = parsed.args.product;
        });
      expect(productAddress).to.be;
      product = await ethers.getContractAt("Product", productAddress);
    });
    it("anyone can buy the NFT by paying Commitment token", async () => {
      await expect(marketplace.connect(bob).buy(product.address, 3))
        .to.emit(product, "Transfer")
        .withArgs(constants.AddressZero, bob.address, 0)
        .to.emit(product, "Transfer")
        .withArgs(constants.AddressZero, bob.address, 1)
        .to.emit(product, "Transfer")
        .withArgs(constants.AddressZero, bob.address, 2);
    });
    it("cannot buy more than stock", async () => {
      const info = await marketplace.callStatic.products(product.address);
      const stock = info.stock;
      expect(stock).eq(INITIAL_STOCK);
      await expect(
        marketplace.connect(bob).buy(product.address, INITIAL_STOCK + 1)
      ).to.be.revertedWith("Sold out");
    });
    it("manufacturer can engrave something on the product", async () => {
      await product.connect(alice).engrave(0, "ipfs://helloworld");
    });
    it("manufacturer can add stocks", async () => {
      await expect(marketplace.connect(alice).addStocks(product.address, 100))
        .to.emit(marketplace, "Supply")
        .withArgs(product.address, 100);
      const info = await marketplace.callStatic.products(product.address);
      const stock = info.stock;
      expect(stock).eq(INITIAL_STOCK + 100);
    });
  });
});
