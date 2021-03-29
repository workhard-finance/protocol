// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { Contract } from "ethers";
import merge from "deepmerge";
import fs from "fs";
import { MyNetwork } from "./types/network";
import { ContractNames, DeployableContracts } from "./types/contract";

export type Deployed = {
  [network in MyNetwork]?: {
    [contract in ContractNames]?: string;
  };
};

export function getDeployed(): Deployed {
  if (fs.existsSync("deployed.json")) {
    const data = fs.readFileSync("deployed.json", "utf-8");
    const deployed = JSON.parse(data);
    return deployed;
  }
  return {};
}

export function record(
  network: MyNetwork,
  contract: ContractNames,
  address: string
) {
  if (network === "hardhat" || network === "localhost") return;
  const deployed = getDeployed();
  const updated = merge(deployed, {
    [network]: { [contract]: address },
  });
  fs.writeFileSync("deployed.json", JSON.stringify(updated));
}

export async function autoDeploy(
  name: DeployableContracts,
  ...args: any[]
): Promise<Contract> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = getDeployed();
  const deployedAddress = deployed[network]?.[name];

  if (network === "hardhat" || network === "localhost") {
    const contract = await (await ethers.getContractFactory(name)).deploy(
      ...args
    );
    return contract;
  } else if (deployedAddress) {
    console.log(`Contract ${name} is already deployed at ${deployedAddress}`);
    const contract = await ethers.getContractAt(name, deployedAddress);
    return contract;
  } else {
    const contract = await (await ethers.getContractFactory(name)).deploy(
      ...args
    );
    record(network, name, contract.address);
    console.log(`Deployed ${name} at ${contract.address}`);
    return contract;
  }
}

export async function getDeployedContract(
  deployed: Deployed,
  name: ContractNames
) {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployedAddress = deployed[network]?.[name];
  if (!deployedAddress) throw Error(`${name} is not deployed on ${network}`);
  const contract = await ethers.getContractAt(name, deployedAddress);
  return contract;
}
