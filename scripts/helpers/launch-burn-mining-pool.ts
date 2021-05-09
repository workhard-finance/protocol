import { ethers } from "hardhat";
import { Contract } from "ethers";

export async function launchBurnMiningPool(
  visionEmitter: Contract,
  burnToken: string,
): Promise<Contract> {
  await visionEmitter.newBurnMiningPool(burnToken)
  const poolAddr = await visionEmitter.callStatic.burnMiningPools(burnToken)
  const contract = await ethers.getContractAt("BurnMining", poolAddr)
  return contract
}