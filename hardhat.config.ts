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

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: "0.7.6",
  networks: {
    hardhat: {
      forking: {
        url: process.env.JSON_RPC_URL,
      },
    },
    mainnet: {
      url: process.env.JSON_RPC_URL,
      accounts: [process.env.DEPLOYER_KEY],
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.DEPLOYER_KEY],
    },
  },
};
