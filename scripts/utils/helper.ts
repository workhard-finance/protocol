// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { Contract } from "ethers";
import lowdb, { LowdbAsync } from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import merge from "deepmerge";
import fs from "fs";
import {
  Deployed,
  ContractNames,
  DeployableContracts,
  MyNetwork,
} from "../../deployed";
import { solidityKeccak256 } from "ethers/lib/utils";

function deployFileName(): string {
  const network: MyNetwork = hre.network.name as MyNetwork;
  const fileName = ["mainnet", "rinkeby"].includes(network)
    ? "deployed.json"
    : "deployed.dev.json";
  return fileName;
}

let db: lowdb.LowdbSync<Deployed>;

export const getDB = async () => {
  if (!db) {
    const adapter = new FileSync<Deployed>(deployFileName());
    db = lowdb(adapter);
    await db
      .defaults({ localhost: {}, rinkeby: {}, hardhat: {}, mainnet: {} })
      .write();
  }
  return db;
};

export async function record(
  network: MyNetwork,
  contract: ContractNames,
  address: string
) {
  const db = await getDB();
  await db.set(`${network}.${contract}`, address).write();
}

export async function sequence(
  network: MyNetwork,
  key: number,
  description: string,
  run: () => Promise<string | undefined>
): Promise<void> {
  const db = await getDB();
  const recorded = await db.get(`${network}.${key}`).value();
  if (!!recorded) {
    console.log(`(skip) ${key}.${description}: ${recorded}`);
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
      await db.set(`${network}.${key}`, result).write();
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
  const db = await getDB();
  const deployedAddress = await db.get(`${network}.${name}`).value();

  if (network === "hardhat") {
    const contract = await (await ethers.getContractFactory(name)).deploy(
      ...args
    );
    return contract;
  } else if (deployedAddress) {
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
