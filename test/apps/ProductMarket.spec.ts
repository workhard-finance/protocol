import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract, BigNumber, Signer, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { AppFixture, appFixture } from "../utils/fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

describe("ProductMarket.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manufacturer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let fixture: AppFixture;
  let productMarket: Contract;
  let productFactory: Contract;
  let laborMarket: Contract;
  let commitmentToken: Contract;
  let baseStableCoin: Contract;
  let visionFarm: Contract;
  let timelock: Contract;
  const INITIAL_EMISSION_AMOUNT: BigNumber = parseEther("24000000");
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manufacturer = signers[1];
    alice = signers[1];
    bob = signers[2];
    const ERC20 = await ethers.getContractFactory("TestERC20");
    baseStableCoin = await ERC20.deploy();
    fixture = await appFixture(
      deployer,
      deployer.address,
      baseStableCoin.address
    );
    commitmentToken = fixture.commitmentToken;
    productMarket = fixture.productMarket;
    productFactory = fixture.productFactory;
    laborMarket = fixture.laborMarket;
    visionFarm = fixture.visionFarm;
    timelock = fixture.timelockedGovernance;
    await baseStableCoin.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: Signer) => {
      const addr = await account.getAddress();
      await baseStableCoin.mint(addr, parseEther("10000"));
      await baseStableCoin
        .connect(account)
        .approve(laborMarket.address, parseEther("10000"));
      await laborMarket.connect(account).payInsteadOfWorking(parseEther("100"));
      commitmentToken
        .connect(account)
        .approve(productMarket.address, parseEther("10000"));
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
    let product: Contract;
    beforeEach("should create a new NFT contract", async () => {
      const receipt = await productMarket
        .connect(alice)
        .launchNewProduct(
          PRODUCT_NAME,
          PRODUCT_SYMBOL,
          BASE_URI,
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
      await expect(productMarket.connect(bob).buy(product.address, 3))
        .to.emit(product, "Transfer")
        .withArgs(constants.AddressZero, bob.address, 0)
        .to.emit(product, "Transfer")
        .withArgs(constants.AddressZero, bob.address, 1)
        .to.emit(product, "Transfer")
        .withArgs(constants.AddressZero, bob.address, 2);
    });
    it("cannot buy more than stock", async () => {
      const info = await productMarket.callStatic.products(product.address);
      const stock = info.stock;
      expect(stock).eq(INITIAL_STOCK);
      await expect(
        productMarket.connect(bob).buy(product.address, INITIAL_STOCK + 1)
      ).to.be.revertedWith("Sold out");
    });
    it("manufacturer can engrave something on the product", async () => {
      await product.connect(alice).engrave(0, "ipfs://helloworld");
    });
    it("manufacturer can add stocks", async () => {
      await expect(productMarket.connect(alice).addStocks(product.address, 100))
        .to.emit(productMarket, "Supply")
        .withArgs(product.address, 100);
      const info = await productMarket.callStatic.products(product.address);
      const stock = info.stock;
      expect(stock).eq(INITIAL_STOCK + 100);
    });
  });
});
