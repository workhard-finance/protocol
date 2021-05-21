import { mintBaseCurrency } from "./actions";

export async function main() {
  await mintBaseCurrency();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
