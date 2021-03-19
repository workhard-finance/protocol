import { ethers } from "hardhat";

export const goToNextWeek = async () => {
  await ethers.provider.send("evm_setNextBlockTimestamp", [
    (await ethers.provider.getBlock("latest")).timestamp + 604800,
  ]);
};

export const goTo = async (seconds: number) => {
  await ethers.provider.send("evm_setNextBlockTimestamp", [
    (await ethers.provider.getBlock("latest")).timestamp + seconds,
  ]);
};
