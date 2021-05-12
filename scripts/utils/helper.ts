// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { Contract } from "ethers";
import merge from "deepmerge";
import fs from "fs";
import {
  Deployed,
  ContractNames,
  DeployableContracts,
  MyNetwork,
  DeployedSequence,
} from "../../deployed";
import { solidityKeccak256 } from "ethers/lib/utils";

function deployFileName(): string {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const fileName = ["mainnet", "rinkeby"].includes(network)
    ? "deployed.json"
    : "deployed.dev.json";
  return fileName;
}

export function getDeployed(): Deployed {
  const fileName = deployFileName();
  if (fs.existsSync(fileName)) {
    const data = fs.readFileSync(fileName, "utf-8");
    const deployed = JSON.parse(data);
    return deployed;
  }
  return {};
}

export function getDeployedSequence(): DeployedSequence {
  return getDeployed() as DeployedSequence;
}

export function record(
  network: MyNetwork,
  contract: ContractNames,
  address: string
) {
  const deployed = getDeployed();
  const updated = merge(deployed, {
    [network]: { [contract]: address },
  });
  const fileName = deployFileName();
  fs.writeFileSync(fileName, JSON.stringify(updated));
}

export function recordSequence(
  network: MyNetwork,
  sequence: string,
  result: boolean
) {
  const deployed = getDeployed();
  const updated = merge(deployed, {
    [network]: { sequence: { [sequence]: result } },
  });
  const fileName = deployFileName();
  fs.writeFileSync(fileName, JSON.stringify(updated));
}

export async function sequence(
  network: MyNetwork,
  key: number,
  description: string,
  run: () => Promise<string | undefined>
): Promise<void> {
  const deployed = getDeployedSequence();
  const recorded = deployed[network]?.sequence;
  if (!!recorded && recorded[key]) {
    console.log(`(skip) ${key}.${description}: ${recorded[key]}`);
    return;
  } else {
    let result: string | undefined;
    try {
      result = await run();
    } catch (err) {
      console.error(err);
      result = undefined;
    }
    if (result) {
      console.log(`(pass) ${key}.${description}${result && ": " + result}`);
      const updated = merge(deployed, {
        [network]: { sequence: { [key]: result } },
      });
      const fileName = deployFileName();
      fs.writeFileSync(fileName, JSON.stringify(updated));
    } else {
      console.log(`(fail) ${key}.${description}`);
      throw Error(`Failed to execute sequence ${key}`);
    }
  }
}

export async function autoDeploy(
  name: DeployableContracts,
  ...args: any[]
): Promise<Contract> {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployed = getDeployed();
  const deployedAddress = deployed[network]?.[name];

  if (network === "hardhat") {
    const contract = await (await ethers.getContractFactory(name)).deploy(
      ...args
    );
    return contract;
  } else if (deployedAddress) {
    // console.log(`Contract ${name} is already deployed at ${deployedAddress}`);
    const contract = await ethers.getContractAt(name, deployedAddress);
    return contract;
  } else {
    const contract = await (await ethers.getContractFactory(name)).deploy(
      ...args
    );
    record(network, name, contract.address);
    return contract;
  }
}

export async function getDeployedContract(
  deployed: Deployed,
  name: ContractNames,
  artifactName?: string
) {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const deployedAddress = deployed[network]?.[name];
  if (!deployedAddress) throw Error(`${name} is not deployed on ${network}`);
  const contract = await ethers.getContractAt(
    artifactName || name,
    deployedAddress
  );
  return contract;
}

export const getRoleHash = (str) => {
  return solidityKeccak256(["string"], [str]);
};
