import { utils } from "ethers";

const { keccak256, solidityPack, getAddress } = utils;

export const getCreate2Address = (
  factoryAddress: string,
  [token, emitter, baseToken]: [string, string, string],
  bytecode: string
): string => {
  const create2Inputs = [
    "0xff",
    factoryAddress,
    keccak256(
      solidityPack(
        ["address", "address", "address"],
        [token, emitter, baseToken]
      )
    ),
    keccak256(bytecode),
  ];
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join("")}`;
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
};
