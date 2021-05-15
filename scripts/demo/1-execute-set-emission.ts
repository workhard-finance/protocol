import { executeSetEmission } from "./actions";

export async function main() {
  await executeSetEmission();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
