/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { ITokenEmitter } from "../ITokenEmitter";

export class ITokenEmitter__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ITokenEmitter {
    return new Contract(address, _abi, signerOrProvider) as ITokenEmitter;
  }
}

const _abi = [
  {
    inputs: [],
    name: "distribute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emissionPeriod",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_emissionPeriod",
        type: "uint256",
      },
    ],
    name: "setEmissionPeriod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "commit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "liquidity",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "dev",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "caller",
        type: "uint256",
      },
    ],
    name: "setWeight",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_liquidityMining",
        type: "address",
      },
      {
        internalType: "address",
        name: "_commitMining",
        type: "address",
      },
    ],
    name: "start",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
