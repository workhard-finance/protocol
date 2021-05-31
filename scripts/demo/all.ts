import { isForkedNet } from "../utils/deployer";
import {
  addLiquidity,
  approveProject,
  distribute,
  distributeReward,
  launchWorkersUnion,
  mintBaseCurrency,
  newCryptoJob,
  swapBaseCurrency,
} from "./actions";

async function main() {
  await distribute();
  if (await isForkedNet()) {
    await swapBaseCurrency();
  } else {
    await mintBaseCurrency();
  }
  await addLiquidity();
  await launchWorkersUnion();
  await newCryptoJob();
  await approveProject();
  await distributeReward();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
