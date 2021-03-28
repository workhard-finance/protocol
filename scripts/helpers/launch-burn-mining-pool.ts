import { ethers } from "hardhat";
import { Contract } from "ethers";

export async function launchBurnMiningPool(
  visionTokenEmitter: Contract,
  burnToken: string,
): Promise<Contract> {
  await visionTokenEmitter.newBurnMiningPool(burnToken)
  const poolAddr = await visionTokenEmitter.callStatic.burnMiningPools(burnToken)
  const contract = await ethers.getContractAt("BurnMining", poolAddr)
  return contract
}