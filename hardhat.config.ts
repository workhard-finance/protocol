import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";

require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
task(
  "snapshot",
  "Take a snapshot. Please note that snapshot can be used only once."
).setAction(async (_args, hre) => {
  const result = await hre.ethers.provider.send("evm_snapshot", []);
  console.log(`Snapshot id: ${result}`);
});

task("revert", "Go to snapshot")
  .addParam("id", "Snapshot id")
  .setAction(async ({ id }, hre) => {
    const result = await hre.ethers.provider.send("evm_revert", [id]);
    if (result) {
      const newSnapshot = await hre.ethers.provider.send("evm_snapshot", []);
      console.log(`Reverted. New snapshot id: ${newSnapshot}`);
    } else {
      console.log("Failed to revert");
    }
  });

task("increase-time", "Increase timestamp")
  .addPositionalParam("seconds", "in seconds")
  .setAction(async ({ seconds }, hre) => {
    const newTimestamp =
      (await hre.ethers.provider.getBlock("latest")).timestamp +
      parseInt(seconds);
    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
    await hre.ethers.provider.send("evm_mine", []);
    console.log(`New time: ${new Date(newTimestamp * 1000).toLocaleString()}`);
  });

task("mine")
  .setDescription(
    "--start or --stop. If you stop mining 'automine' will run instead."
  )
  .addFlag("start")
  .addFlag("stop")
  .setAction(async (args, hre) => {
    if (args.start) {
      await hre.ethers.provider.send("evm_setAutomine", [false]);
      await hre.ethers.provider.send("evm_setIntervalMining", [5000]);
    } else if (args.stop) {
      await hre.ethers.provider.send("evm_setAutomine", [true]);
      await hre.ethers.provider.send("evm_setIntervalMining", [0]);
    }
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

let hardhat = {};
if (process.env.FORK?.length > 0) {
  hardhat["forking"] = { url: process.env.FORK };
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.5.16",
      },
    ],
    overrides: {},
  },
  networks: {
    hardhat,
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
  },
};
