import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { keccak256, parseEther, solidityPack } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getWorkhard } from "../../../scripts/fixtures";
import {
  COMMIT,
  DividendPool,
  ERC20,
  ERC20__factory,
  Marketplace,
  StableReserve,
  TimelockedGovernance,
  Workhard,
  DAO,
} from "../../../src";
import { runTimelockTx } from "../../utils/utilities";

chai.use(solidity);

describe("Marketplace.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manufacturer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let workhard: Workhard;
  let masterDAO: DAO;
  let marketplace: Marketplace;
  let stableReserve: StableReserve;
  let commit: COMMIT;
  let baseCurrency: ERC20;
  let dividendPool: DividendPool;
  let timelock: TimelockedGovernance;
  const PRICE_IN_COMMIT_TOKEN = parseEther("1");
  const PROFIT_FOR_MANUFACTURER = 1000;
  const PRODUCT_URI = "ipfscid";
  let PROJ_ID: BigNumber;
  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    manufacturer = signers[1];
    alice = signers[1];
    bob = signers[2];
    workhard = await getWorkhard();
    masterDAO = await workhard.getMasterDAO();
    baseCurrency = ERC20__factory.connect(
      masterDAO.baseCurrency.address,
      deployer
    );
    commit = masterDAO.commit;
    marketplace = masterDAO.marketplace;
    stableReserve = masterDAO.stableReserve;
    dividendPool = masterDAO.dividendPool;
    timelock = masterDAO.timelock;
    PROJ_ID = BigNumber.from(
      keccak256(
        solidityPack(["string", "address"], [PRODUCT_URI, alice.address])
      )
    );
    await baseCurrency.mint(deployer.address, parseEther("10000"));
    const prepare = async (account: SignerWithAddress) => {
      await baseCurrency.mint(account.address, parseEther("10000"));
      await baseCurrency
        .connect(account)
        .approve(stableReserve.address, parseEther("10000"));
      await stableReserve
        .connect(account)
        .payInsteadOfWorking(parseEther("5000"));
      await commit
        .connect(account)
        .approve(marketplace.address, parseEther("10000"));
    };
    await prepare(manufacturer);
    await prepare(alice);
    await prepare(bob);
  });
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
  });
  describe("manufacture()", async () => {
    it("anyone can buy the NFT by paying Commit token", async () => {
      await expect(
        marketplace
          .connect(alice)
          .manufacture(
            PRODUCT_URI,
            PROFIT_FOR_MANUFACTURER,
            PRICE_IN_COMMIT_TOKEN
          )
      )
        .to.emit(marketplace, "NewProduct")
        .withArgs(PROJ_ID, alice.address, PRODUCT_URI);
      await expect(
        marketplace.connect(bob).buy(PROJ_ID, bob.address, 3)
      ).to.emit(marketplace, "TransferSingle");
    });
  });
  describe("manufactureLimitedEdition()", () => {
    beforeEach(async () => {
      await marketplace
        .connect(alice)
        .manufactureLimitedEdition(
          PRODUCT_URI,
          PROFIT_FOR_MANUFACTURER,
          PRICE_IN_COMMIT_TOKEN,
          10
        );
    });
    it("should allow purchase upto its max supply", async () => {
      await expect(marketplace.connect(bob).buy(PROJ_ID, bob.address, 10)).not
        .to.be.reverted;
    });
    it("should limit the total supply", async () => {
      await expect(
        marketplace.connect(bob).buy(PROJ_ID, bob.address, 11)
      ).to.be.revertedWith("Not enough stock");
    });
  });
  describe("setters", () => {
    beforeEach(async () => {
      await marketplace
        .connect(alice)
        .manufacture(
          PRODUCT_URI,
          PROFIT_FOR_MANUFACTURER,
          PRICE_IN_COMMIT_TOKEN
        );
    });
    describe("setMaxSupply()", () => {
      it("should make a product as a limited edition", async () => {
        await marketplace.connect(alice).setMaxSupply(PROJ_ID, 10);
        await expect(
          marketplace.connect(bob).buy(PROJ_ID, bob.address, 11)
        ).to.be.revertedWith("Not enough stock");
      });
      it("should not be changed", async () => {
        await marketplace.connect(alice).setMaxSupply(PROJ_ID, 10);
        await expect(
          marketplace.connect(alice).setMaxSupply(PROJ_ID, 11)
        ).to.be.revertedWith("Max supply is already set");
      });
      it("should be greater than existing supply", async () => {
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 11);
        await expect(
          marketplace.connect(alice).setMaxSupply(PROJ_ID, 10)
        ).to.be.revertedWith("Max supply is less than current supply");
      });
    });
    describe("setPrice()", () => {
      it("should update the price", async () => {
        const prevBal0 = await commit.balanceOf(bob.address);
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 3);
        const newBal0 = await commit.balanceOf(bob.address);
        await marketplace
          .connect(alice)
          .setPrice(PROJ_ID, PRICE_IN_COMMIT_TOKEN.mul(2));
        const prevBal1 = await commit.balanceOf(bob.address);
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 3);
        const newBal1 = await commit.balanceOf(bob.address);
        expect(newBal1.sub(prevBal1)).to.eq(newBal0.sub(prevBal0).mul(2));
      });
    });
    describe("setProfitRate()", () => {
      it("should update the profit rate for the manufacturer", async () => {
        const prevBal0 = await commit.balanceOf(alice.address);
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 3);
        const newBal0 = await commit.balanceOf(alice.address);
        await marketplace
          .connect(alice)
          .setProfitRate(PROJ_ID, PROFIT_FOR_MANUFACTURER * 2);
        const prevBal1 = await commit.balanceOf(alice.address);
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 3);
        const newBal1 = await commit.balanceOf(alice.address);
        expect(newBal1.sub(prevBal1)).to.eq(newBal0.sub(prevBal0).mul(2));
      });
    });
    describe("setFeatured()", () => {
      it("should be updated by the gov", async () => {
        await expect(
          marketplace.connect(alice).setFeatured([PROJ_ID])
        ).to.be.revertedWith("Not authorized");
        await expect(
          runTimelockTx(
            timelock.connect(deployer),
            marketplace.populateTransaction.setFeatured([PROJ_ID])
          )
        ).not.to.be.reverted;
        expect(await marketplace.featured()).to.deep.eq([PROJ_ID]);
      });
    });
    describe("setTaxRate()", () => {
      it("should change the tax rate", async () => {
        expect(await marketplace.taxRate()).to.eq(2000);
        await runTimelockTx(
          timelock.connect(deployer),
          marketplace.populateTransaction.setTaxRate(4000)
        );
        expect(await marketplace.taxRate()).to.eq(4000);
      });
      it("should change the shared amount with the dividend pool", async () => {
        const prevBal0 = await commit.balanceOf(dividendPool.address);
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 3);
        const newBal0 = await commit.balanceOf(dividendPool.address);
        await runTimelockTx(
          timelock.connect(deployer),
          marketplace.populateTransaction.setTaxRate(4000)
        );
        const prevBal1 = await commit.balanceOf(dividendPool.address);
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 3);
        const newBal1 = await commit.balanceOf(dividendPool.address);
        expect(newBal1.sub(prevBal1)).to.eq(newBal0.sub(prevBal0).mul(2));
      });
    });
  });

  describe("getters", () => {
    beforeEach(async () => {
      await marketplace
        .connect(alice)
        .manufacture(
          PRODUCT_URI,
          PROFIT_FOR_MANUFACTURER,
          PRICE_IN_COMMIT_TOKEN
        );
    });
    describe("commitToken()", () => {
      it("should return commit token address", async () => {
        expect(await marketplace.commitToken()).to.eq(commit.address);
      });
    });
    describe("products()", () => {
      it("should return the product metadata", async () => {
        const product = await marketplace.products(PROJ_ID);
        expect(product.manufacturer).to.eq(alice.address);
        expect(product.totalSupply).to.eq(0);
        expect(product.maxSupply).to.eq(0);
        expect(product.price).to.eq(PRICE_IN_COMMIT_TOKEN);
        expect(product.profitRate).to.eq(PROFIT_FOR_MANUFACTURER);
        expect(product.uri).to.eq(PRODUCT_URI);
      });
      it("should be updated when new buy exists", async () => {
        await marketplace.connect(bob).buy(PROJ_ID, bob.address, 3);
        const product = await marketplace.products(PROJ_ID);
        expect(product.manufacturer).to.eq(alice.address);
        expect(product.totalSupply).to.eq(3);
        expect(product.maxSupply).to.eq(0);
      });
      it("should be update the price data when the manufacturer updates the price and profit rate", async () => {
        await marketplace
          .connect(alice)
          .setPrice(PROJ_ID, PRICE_IN_COMMIT_TOKEN.mul(2));
        await marketplace
          .connect(alice)
          .setProfitRate(PROJ_ID, PROFIT_FOR_MANUFACTURER * 2);
        const product = await marketplace.products(PROJ_ID);
        expect(product.price).to.eq(PRICE_IN_COMMIT_TOKEN.mul(2));
        expect(product.profitRate).to.eq(PROFIT_FOR_MANUFACTURER * 2);
      });
    });
  });
});
