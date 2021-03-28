import { ethers } from "hardhat";
import { Contract } from "ethers";

export async function launchStakeMiningPool(
  visionTokenEmitter: Contract,
  stakeToken: string
): Promise<Contract> {
  await visionTokenEmitter.newStakeMiningPool(stakeToken);
  const poolAddr = await visionTokenEmitter.callStatic.stakeMiningPools(
    stakeToken
  );
  const contract = await ethers.getContractAt("StakeMining", poolAddr);
  return contract;
}
