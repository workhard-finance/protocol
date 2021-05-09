import { ethers } from "hardhat";
import { Contract } from "ethers";

export async function launchStakeMiningPool(
  visionEmitter: Contract,
  stakeToken: string
): Promise<Contract> {
  await visionEmitter.newStakeMiningPool(stakeToken);
  const poolAddr = await visionEmitter.callStatic.stakeMiningPools(
    stakeToken
  );
  const contract = await ethers.getContractAt("StakeMining", poolAddr);
  return contract;
}
