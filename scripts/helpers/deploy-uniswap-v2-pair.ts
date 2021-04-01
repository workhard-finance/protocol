import { ethers } from "hardhat";
import { constants, Contract } from "ethers";

const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

export async function deployUniswapLP(
  token0: string,
  token1: string
): Promise<Contract> {
  const [deployer] = await ethers.getSigners();
  const network = ethers.provider.network.name;
  let uniswapV2Factory: Contract;
  if (["mainnet", "rinkeby"].includes(network)) {
    uniswapV2Factory = await ethers.getContractAt(
      "IUniswapV2Factory",
      UNISWAP_FACTORY
    );
  } else {
    const UniswapV2Factory = await ethers.getContractFactory(
      "UniswapV2Factory"
    );
    uniswapV2Factory = await UniswapV2Factory.deploy(deployer.address);
  }
  let deployedLP = await uniswapV2Factory.getPair(token0, token1);
  if (deployedLP === constants.AddressZero) {
    await uniswapV2Factory.createPair(token0, token1);
    deployedLP = await uniswapV2Factory.getPair(token0, token1);
  }
  const lpToken = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    deployedLP
  );
  return lpToken;
}
