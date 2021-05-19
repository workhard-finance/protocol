import { ethers } from "hardhat";
import {
  getBaseCurrency,
  getCommit,
  getCommitMining,
  getDividendPool,
  getJobBoard,
  getLiquidityMining,
  getProject,
  getTimelockedGovernance,
  getVision,
  getVisionEmitter,
  getVisionETHLP,
  getWorkersUnion,
} from "../utils/deployer";
import { goToNextWeek, runTimelockTx } from "../../test/utils/utilities";
import { BigNumber, constants } from "ethers";
import { goTo } from "../../test/utils/utilities";
import { parseEther } from "ethers/lib/utils";
import { ERC20__factory } from "../../src";

export async function executeSetEmission() {
  console.log(
    "Execute Emission - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const visionEmitter = await getVisionEmitter(signer);
  const timelock = await getTimelockedGovernance(signer);
  const liquidityMining = await getLiquidityMining(signer);
  const commitMining = await getCommitMining(signer);
  /** launch Mock DAI staking air drop pool */
  const baseCurrency = await getBaseCurrency(signer);
  await visionEmitter.newStakeMiningPool(baseCurrency.address);
  const airdropPool = await visionEmitter.stakeMiningPools(
    baseCurrency.address
  );
  /** set airdrop set emission */
  await runTimelockTx(
    timelock,
    visionEmitter.populateTransaction.setEmission(
      [liquidityMining.address, commitMining.address, airdropPool],
      [4745, 4745, 500],
      499,
      1
    )
  );
}

export async function startEmission() {
  console.log(
    "Start Emission - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const visionEmitter = await getVisionEmitter(signer);
  const timelock = await getTimelockedGovernance(signer);
  /** start **/
  const startTx = await visionEmitter.populateTransaction.start();
  const startTxTimelockTxParams = [
    visionEmitter.address,
    0,
    startTx.data,
    constants.HashZero,
    constants.HashZero,
  ];
  await goTo(86401);
  // @ts-ignore
  await timelock.execute(...startTxTimelockTxParams);
}
export async function distribute() {
  console.log(
    "Distribute - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const visionEmitter = await getVisionEmitter(signer);
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

  const baseCurrency = await getBaseCurrency(signer);
  await ERC20__factory.connect(baseCurrency.address, signer).mint(
    signer.address,
    parseEther("10000")
  );
}

export async function addLiquidity() {
  console.log(
    "Add Liquidity - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const vision = await getVision(signer);
  const visionLP = await getVisionETHLP(signer);
  // const univ2Factory =
  const pair = await ethers.getContractAt(
    "@uniswap/v2-core/contracts/UniswapV2Pair.sol:UniswapV2Pair",
    visionLP.address
  );
  const token0 = await pair.token0();
  const token1 = await pair.token1();
  const wethAddress = token0 !== vision.address ? token0 : token1;
  const WETH = await ethers.getContractAt("WETH9", wethAddress);
  await WETH.deposit({ value: parseEther("100") });
  await WETH.transfer(pair.address, parseEther("100"));
  await vision.approve(visionLP.address, constants.MaxUint256);
  await vision.transfer(pair.address, parseEther("100"));
  await pair.mint(signer.address);
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

  const workersUnion = await getWorkersUnion(signer);

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
  const jobBoard = await getJobBoard(signer);
  await jobBoard.createProject(
    "QmToBdkMKvKaCYRaZtRVWu1tZb3Zg6HSgz13nugRrwzRiJ"
  );
}

export async function approveProject() {
  console.log(
    "Approve Project - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const jobBoard = await getJobBoard(signer);
  const project = await getProject(signer);
  const timelock = await getTimelockedGovernance(signer);
  const tokenId = await project.tokenByIndex(0);
  const tx = await jobBoard.populateTransaction.approveProject(tokenId);
  const data = tx?.data;
  await timelock
    .connect(signer)
    .schedule(
      jobBoard.address,
      0,
      data,
      ethers.constants.HashZero,
      ethers.constants.HashZero,
      BigNumber.from(86400)
    );
  await goTo(86400);
  await timelock
    .connect(signer)
    .execute(
      jobBoard.address,
      0,
      data,
      ethers.constants.HashZero,
      ethers.constants.HashZero
    );
}

export async function addTokens() {
  console.log(
    "Add Tokens - snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();
  const timelock = await getTimelockedGovernance(signer);
  const dividendPool = await getDividendPool(signer);
  const commit = await getCommit(signer);
  const baseCurrency = await getBaseCurrency(signer);
  const populated0 = await dividendPool.populateTransaction.addToken(
    baseCurrency.address
  );
  const populated1 = await dividendPool.populateTransaction.addToken(
    commit.address
  );
  await timelock.executeBatch(
    [dividendPool.address, dividendPool.address],
    [0, 0],
    [populated0.data, populated1.data],
    ethers.constants.HashZero, // predecessor
    ethers.constants.HashZero // salt
  );
}

export async function distributeReward() {
  console.log(
    "Distribute Reward- snapshot id: ",
    await ethers.provider.send("evm_snapshot", [])
  );

  const [signer] = await ethers.getSigners();

  const baseCurrency = await getBaseCurrency(signer);
  await ERC20__factory.connect(baseCurrency.address, signer).mint(
    signer.address,
    parseEther("10000")
  );
  const dividendPool = await getDividendPool(signer);
  await baseCurrency.approve(dividendPool.address, parseEther("10000"));
  await dividendPool.distribute(baseCurrency.address, parseEther("10000"));
  console.log(await dividendPool.claimable(baseCurrency.address));
}
