// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { parseEther } from "@ethersproject/units";
import { constants } from "ethers";
import { getVision, getVisionETHLP } from "../utils/deployer";

async function addLiquidity() {
  const result = await ethers.provider.send("evm_snapshot", []);
  console.log("Mint Base Currency - snapshot id: ", result);
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

addLiquidity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
