// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { executeSetEmission } from "./1-execute-set-emission";
import { newCryptoJob } from "./2-new-crypto-job";
import { approveProject } from "./3-approve-job";
import { launchWorkersUnion } from "./4-workers-union";
import { mintBaseCurrency } from "./5-mint-base-currency";

async function main() {
  // 1
  await executeSetEmission();
  // 2
  await newCryptoJob();
  // 3
  await approveProject();
  // 4
  await launchWorkersUnion();
  // 5
  await mintBaseCurrency();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
