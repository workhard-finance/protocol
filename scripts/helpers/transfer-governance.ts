import hre, { ethers } from "hardhat";
import { Contract, constants } from "ethers";
import { isAddress, solidityKeccak256 } from "ethers/lib/utils";

export const getRoleHash = (str) => {
  return solidityKeccak256(["string"], [str]);
};
export async function scheduleGovernanceTransfer(
  timelock: Contract,
  workersUnion: string,
  deployer: string
) {
  const isDevEnv = !["mainnet", "rinkeby"].includes(
    ethers.provider.network.name
  );
  const MULTISIG_WALLET = process.env.MULTISIG_WALLET;
  let multisig: string;
  if (isDevEnv) {
    multisig = deployer;
  } else {
    if (!isAddress(MULTISIG_WALLET)) {
      throw Error("You should setup multi sig wallet");
    }
    multisig = MULTISIG_WALLET;
  }
  await timelock.grantRole(getRoleHash("PROPOSER_ROLE"), multisig);
  await timelock.grantRole(getRoleHash("EXECUTOR_ROLE"), multisig);
  await timelock.grantRole(getRoleHash("PROPOSER_ROLE"), workersUnion);
  await timelock.grantRole(getRoleHash("EXECUTOR_ROLE"), workersUnion);
  await timelock.grantRole(getRoleHash("TIMELOCK_ADMIN_ROLE"), workersUnion);
  const populated = await timelock.populateTransaction.revokeRole(
    getRoleHash("EXECUTOR_ROLE"),
    multisig
  );
  const delay = 3600 * 24 * 7 * 4; // about 4 weeks
  const target = populated.to;
  if (!target) throw Error("populated tx does not have the to value");
  const txParams = [
    target,
    populated.value || 0,
    populated.data,
    constants.HashZero, // predecessor
    constants.HashZero, // salt
  ];
  await timelock.forceSchedule(...txParams, delay);
  if (!isDevEnv) {
    await timelock.revokeRole(getRoleHash("PROPOSER_ROLE"), deployer);
    await timelock.revokeRole(getRoleHash("EXECUTOR_ROLE"), deployer);
    await timelock.revokeRole(getRoleHash("TIMELOCK_ADMIN_ROLE"), deployer);
  }
}
