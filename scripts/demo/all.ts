import {
  addLiquidity,
  approveProject,
  distribute,
  distributeReward,
  launchWorkersUnion,
  mintBaseCurrency,
  newCryptoJob,
  startEmission,
} from "./actions";

async function main() {
  await startEmission();
  await distribute();
  await mintBaseCurrency();
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
