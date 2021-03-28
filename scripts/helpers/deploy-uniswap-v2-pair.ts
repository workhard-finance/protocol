import { ethers } from "hardhat";
import { Contract } from "ethers";

const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

export async function deployUniswapLP(
  token0: string,
  token1: string
): Promise<Contract> {
  const uniswapV2Factory = await ethers.getContractAt(
    "IUniswapV2Factory",
    UNISWAP_FACTORY
  );
  await uniswapV2Factory.createPair(token0, token1);
  const lpTokenAddress = await uniswapV2Factory.getPair(token0, token1);
  const lpToken = await ethers.getContractAt("IERC20", lpTokenAddress);
  return lpToken;
}
