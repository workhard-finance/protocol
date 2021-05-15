import {
  addLiquidity,
  addTokens,
  approveProject,
  distribute,
  distributeReward,
  executeSetEmission,
  launchWorkersUnion,
  mintBaseCurrency,
  newCryptoJob,
  startEmission,
} from "./actions";

async function main() {
  await executeSetEmission();
  await startEmission();
  await distribute();
  await mintBaseCurrency();
  await addLiquidity();
  await launchWorkersUnion();
  await newCryptoJob();
  await approveProject();
  await addTokens();
  await distributeReward();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
