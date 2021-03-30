/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { IProductFactory } from "../IProductFactory";

export class IProductFactory__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IProductFactory {
    return new Contract(address, _abi, signerOrProvider) as IProductFactory;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_manufacturer",
        type: "address",
      },
      {
        internalType: "address",
        name: "_marketplace",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_maxSupply",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "string",
        name: "_baseURI",
        type: "string",
      },
    ],
    name: "create",
    outputs: [
      {
        internalType: "address",
        name: "product",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];