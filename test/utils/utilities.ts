import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import {
  BigNumber,
  BigNumberish,
  Contract,
  PopulatedTransaction,
} from "ethers";

chai.use(solidity);
const { keccak256, solidityPack, getAddress } = ethers.utils;

export const setNextBlockTimestamp = async (seconds: number) => {
  await ethers.provider.send("evm_setNextBlockTimestamp", [
    (await ethers.provider.getBlock("latest")).timestamp + seconds,
  ]);
};

export const goTo = async (seconds: number) => {
  await setNextBlockTimestamp(seconds);
  await ethers.provider.send("evm_mine", []);
};

export const goToNextWeek = async () => {
  await goTo(604800);
};

export const runTimelockTx = async (
  timelock: Contract,
  tx: Promise<PopulatedTransaction>,
  delay?: number
) => {
  const _delay = delay || 86400;
  const populated = await tx;
  const target = populated.to;
  if (!target) throw Error("populated tx doesn not have the to value");
  const txParams = [
    target,
    populated.value || 0,
    populated.data,
    ethers.constants.HashZero, // predecessor
    ethers.constants.HashZero, // salt
  ];
  await timelock.schedule(...txParams, _delay);
  await ethers.provider.send("evm_setNextBlockTimestamp", [
    (await ethers.provider.getBlock("latest")).timestamp + _delay + 1,
  ]);
  return timelock.execute(...txParams);
};

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

const ONE = ethers.BigNumber.from(1);
const TWO = ethers.BigNumber.from(2);

export const sqrt = (x: BigNumber) => {
  let z = x.add(ONE).div(TWO);
  let y = x;
  while (z.sub(y).isNegative()) {
    y = z;
    z = x.div(z).add(z).div(TWO);
  }
  return y;
};

export const almostEquals = (a: BigNumberish, b: BigNumberish) => {
  const A = BigNumber.from(a);
  const B = BigNumber.from(b);
  if (A.eq(0)) {
    expect(A).eq(B);
  } else {
    expect(A.mul(100)).lt(B.mul(103));
    expect(A.mul(100)).gt(B.mul(97));
  }
};
