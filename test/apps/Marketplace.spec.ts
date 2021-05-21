import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { keccak256, parseEther, solidityPack } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getWorkhard } from "../../scripts/fixtures";
import {
  COMMIT,
  DividendPool,
  ERC20,
  ERC20__factory,
  IERC20,
  Marketplace,
  StableReserve,
  TimelockedGovernance,
  WorkhardClient,
  WorkhardDAO,
} from "../../src";
import { domain } from "process";

chai.use(solidity);

describe("Marketplace.sol", function () {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let manufacturer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let workhard: WorkhardClient;
  let masterDAO: WorkhardDAO;
  let marketplace: Marketplace;
  let stableReserve: StableReserve;
  let commit: COMMIT;
  let baseCurrency: ERC20;
  let dividendPool: DividendPool;
  let timelock: TimelockedGovernance;
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
  let snapshot: string;
  beforeEach(async () => {
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshot]);
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
