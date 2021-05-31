import { isForkedNet } from "../utils/deployer";
import { mintBaseCurrency, swapBaseCurrency } from "./actions";

export async function main() {
  if (await isForkedNet()) {
    await swapBaseCurrency();
  } else {
    await mintBaseCurrency();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
