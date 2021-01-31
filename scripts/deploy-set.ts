// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const ONE_INCH = "0x111111125434b319222CdBf8C261674aDB56F3ae";
const INITIAL_DEVS = ["0x1111111111111111111111111111111111111111"];

export async function deployContractSet(devAddress: string[]) {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // governance contract
  const TheDevs = await ethers.getContractFactory("TheDevs");
  // token contracts
  const VisionToken = await ethers.getContractFactory("VisionToken");
  const CommitmentToken = await ethers.getContractFactory("CommitmentToken");
  // mining contracts
  const CommitmentMining = await ethers.getContractFactory("CommitmentMining");
  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const VisionFarm = await ethers.getContractFactory("VisionFarm");
  const VisionTokenEmitter = await ethers.getContractFactory(
    "VisionTokenEmitter"
  );
  // apps
  const ProductFactory = await ethers.getContractFactory("ProductFactory");
  const LaborMarket = await ethers.getContractFactory("LaborMarket");
  const ProductMarket = await ethers.getContractFactory("ProductMarket");
  const DealManager = await ethers.getContractFactory("DealManager");

  // deploy devs contract
  const devs = await TheDevs.deploy(devAddress);
  // deploy token contracts
  const commitmentToken = await CommitmentToken.deploy();
  const visionToken = await VisionToken.deploy();
  // deploy uniswap pair
  const uniswapFactory = await ethers.getContractAt(
    "IUniswapV2Factory",
    UNISWAP_FACTORY
  );
  const test = await uniswapFactory.getPair(DAI, WETH);
  await uniswapFactory.createPair(visionToken.address, WETH);
  const lpTokenAddress = await uniswapFactory.getPair(
    visionToken.address,
    WETH
  );
  const lpToken = await ethers.getContractAt("IERC20", lpTokenAddress);

  // deploy mining programs
  const visionTokenEmitter = await VisionTokenEmitter.deploy(
    devs.address,
    devs.address,
    visionToken.address
  );
  const visionFarm = await VisionFarm.deploy(
    devs.address,
    visionToken.address
  );
  const liquidityMining = await LiquidityMining.deploy(
    devs.address,
    visionToken.address,
    visionTokenEmitter.address,
    lpToken.address
  );
  const commitmentMining = await CommitmentMining.deploy(
    devs.address,
    visionToken.address,
    visionTokenEmitter.address,
    commitmentToken.address
  );

  // deploy apps
  const productFactory = await ProductFactory.deploy();
  const laborMarket = await LaborMarket.deploy(
    devs.address,
    commitmentToken.address,
    DAI
  );
  const productMarket = await ProductMarket.deploy(
    devs.address,
    productFactory.address,
    commitmentToken.address,
    visionFarm.address
  );
  const dealManager = await DealManager.deploy(
    devs.address,
    visionFarm.address,
    laborMarket.address,
    DAI,
    ONE_INCH
  );

  // transfer ownerships of tokens
  await commitmentToken.setMinter(laborMarket.address);
  await visionToken.setMinter(visionTokenEmitter.address);
  return {
    devs,
    visionToken,
    commitmentToken,
    lpToken,
    visionTokenEmitter,
    visionFarm,
    liquidityMining,
    commitmentMining,
    laborMarket,
    productMarket,
    dealManager,
  };
}
