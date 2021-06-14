import { ethers } from "hardhat";
import {
  getPool2Factory,
  getWETH,
  isForkedNet,
  SUSHISWAP_FACTORY,
  WETH,
} from "../utils/deployer";
import { goToNextWeek } from "../../test/utils/utilities";
import { constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import {
  ERC20__factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair__factory,
  WETH9__factory,
} from "../../src";
import { Workhard } from "../../src";

import deployed from "../../deployed.dev.json";

export async function distribute() {
  console.log(
    "Distribute - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const client = await Workhard.from(ethers.provider, deployed, {
    account: signer,
  });
  const masterDAO = await client.getMasterDAO();

  const { visionEmitter } = masterDAO;
  /** distribute **/
  await goToNextWeek();
  await visionEmitter.distribute();
}

export async function mintBaseCurrency() {
  console.log(
    "Mint Base Currency - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const client = await Workhard.from(ethers.provider, deployed, {
    account: signer,
  });
  const masterDAO = await client.getMasterDAO();
  const { baseCurrency } = masterDAO;

  await ERC20__factory.connect(baseCurrency.address, signer).mint(
    signer.address,
    parseEther("10000")
  );
}

export async function swapBaseCurrency() {
  console.log(
    "Mint Base Currency - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const client = await Workhard.from(ethers.provider, deployed, {
    account: signer,
  });
  const masterDAO = await client.getMasterDAO();
  const { baseCurrency } = masterDAO;
  const sushiFactory = IUniswapV2Factory__factory.connect(
    SUSHISWAP_FACTORY,
    signer
  );
  const ethDAISushiPoolAddr = await sushiFactory.getPair(
    WETH,
    baseCurrency.address
  );
  const ethDAISushiPool = IUniswapV2Pair__factory.connect(
    ethDAISushiPoolAddr,
    signer
  );
  const weth = WETH9__factory.connect(WETH, signer);
  await weth.deposit({ value: parseEther("100") });
  await weth.approve(ethDAISushiPoolAddr, constants.MaxUint256);
  await weth.transfer(ethDAISushiPoolAddr, parseEther("100"));
  await ethDAISushiPool.swap(parseEther("10000"), 0, signer.address, "0x");
}

export async function addLiquidity() {
  console.log(
    "Add Liquidity - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );
  const [signer] = await ethers.getSigners();
  const client = await Workhard.from(ethers.provider, deployed, {
    account: signer,
  });
  const masterDAO = await client.getMasterDAO();
  const { vision } = masterDAO;
  const pool2Factory = await getPool2Factory(signer);
  const weth = await getWETH(signer);
  const visionLPAddress = await pool2Factory.getPair(
    vision.address,
    weth.address
  );
  const visionLP = await ethers.getContractAt(
    "@uniswap/v2-core/contracts/UniswapV2Pair.sol:UniswapV2Pair",
    visionLPAddress
  );
  const token0 = await visionLP.token0();
  const token1 = await visionLP.token1();
  const wethAddress = token0 !== vision.address ? token0 : token1;
  const WETH = await ethers.getContractAt("WETH9", wethAddress);
  await WETH.deposit({ value: parseEther("100") });
  await WETH.transfer(visionLP.address, parseEther("100"));
  await vision.approve(visionLP.address, constants.MaxUint256);
  await vision.transfer(visionLP.address, parseEther("100"));
  await visionLP.mint(signer.address);
  if ((await visionLP.balanceOf(signer.address)).eq(0)) {
    throw Error("Faield to add liquidity.");
  }
}

export async function launchWorkersUnion() {
  console.log(
    "Launch Workers Union - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const client = await Workhard.from(ethers.provider, deployed, {
    account: signer,
  });
  const masterDAO = await client.getMasterDAO();
  const { workersUnion } = masterDAO;

  await goToNextWeek();
  await goToNextWeek();
  await goToNextWeek();
  await goToNextWeek();
  await workersUnion.launch();
}

export async function newCryptoJob() {
  console.log(
    "New Job Post - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const client = await Workhard.from(ethers.provider, deployed, {
    account: signer,
  });
  const masterDAO = await client.getMasterDAO();

  await client.project.createProject(
    0,
    "QmToBdkMKvKaCYRaZtRVWu1tZb3Zg6HSgz13nugRrwzRiJ"
  );
}

export async function distributeReward() {
  console.log(
    "Distribute Reward- snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const client = await Workhard.from(ethers.provider, deployed, {
    account: signer,
  });
  const masterDAO = await client.getMasterDAO();
  const { baseCurrency, dividendPool } = masterDAO;
  if (await isForkedNet()) {
    await swapBaseCurrency();
  } else {
    await ERC20__factory.connect(baseCurrency.address, signer).mint(
      signer.address,
      parseEther("10000")
    );
  }
  await baseCurrency.approve(dividendPool.address, parseEther("10000"));
  await dividendPool.distribute(baseCurrency.address, parseEther("10000"));
}
