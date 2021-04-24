import { Contract, constants } from "ethers";
import { keccak256, isAddress, solidityKeccak256 } from "ethers/lib/utils";

export const getRoleHash = (str) => {
  return solidityKeccak256(["string"], [str]);
};
export async function scheduleGovernanceTransfer(
  timelock: Contract,
  farmersUnion: string,
  deployer: string
) {
  const MULTISIG_WALLET = process.env.MULTISIG_WALLET;
  const multisig = isAddress(MULTISIG_WALLET) ? MULTISIG_WALLET : deployer;
  await timelock.grantRole(getRoleHash("PROPOSER_ROLE"), multisig);
  await timelock.grantRole(getRoleHash("EXECUTOR_ROLE"), multisig);
  await timelock.grantRole(getRoleHash("PROPOSER_ROLE"), farmersUnion);
  await timelock.grantRole(getRoleHash("EXECUTOR_ROLE"), farmersUnion);
  await timelock.grantRole(getRoleHash("TIMELOCK_ADMIN_ROLE"), farmersUnion);
  await timelock.revokeRole(getRoleHash("TIMELOCK_ADMIN_ROLE"), deployer);
  const populated = await timelock.populateTransaction.revokeRole(
    getRoleHash("EXECUTOR_ROLE"),
    deployer
  );
  const delay = 3600 * 24 * 7 * 4; // about 4 weeks
  const target = populated.to;
  if (!target) throw Error("populated tx doesn not have the to value");
  const txParams = [
    target,
    populated.value || 0,
    populated.data,
    constants.HashZero, // predecessor
    constants.HashZero, // salt
  ];
  await timelock.forceSchedule(...txParams, delay);
}
