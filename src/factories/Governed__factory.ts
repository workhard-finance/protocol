/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { Governed } from "../Governed";

export class Governed__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Governed> {
    return super.deploy(overrides || {}) as Promise<Governed>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Governed {
    return super.attach(address) as Governed;
  }
  connect(signer: Signer): Governed__factory {
    return super.connect(signer) as Governed__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Governed {
    return new Contract(address, _abi, signerOrProvider) as Governed;
  }
}

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [],
    name: "Anarchized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_prevGovernance",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_newGovernance",
        type: "address",
      },
    ],
    name: "NewGovernance",
    type: "event",
  },
  {
    inputs: [],
    name: "anarchize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "anarchizedAt",
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
    inputs: [],
    name: "forceAnarchize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "forceAnarchizeAt",
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
    inputs: [],
    name: "gov",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "setAnarchyPoint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_gov",
        type: "address",
      },
    ],
    name: "setGovernance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040526000600155600060025534801561001a57600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506107ce8061006a6000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c806366bfc1581161005b57806366bfc158146100ca5780639c724e24146100e8578063ab033ea914610106578063de19d0791461014a5761007d565b806312d43a51146100825780631b343adc146100b6578063605cfbb5146100c0575b600080fd5b61008a610178565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100be61019c565b005b6100c8610267565b005b6100d2610362565b6040518082815260200191505060405180910390f35b6100f0610368565b6040518082815260200191505060405180910390f35b6101486004803603602081101561011c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061036e565b005b6101766004803603602081101561016057600080fd5b81019080803590602001909291905050506104de565b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461025d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b61026561067a565b565b600060025414156102e0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260168152602001807f43616e6e6f742064697362616e642074686520676f760000000000000000000081525060200191505060405180910390fd5b600254421015610358576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260168152602001807f43616e6e6f742064697362616e642074686520676f760000000000000000000081525060200191505060405180910390fd5b61036061067a565b565b60015481565b60025481565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461042f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156104d2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260188152602001807f55736520616e61726368697a65282920696e73746561642e000000000000000081525060200191505060405180910390fd5b6104db816106b9565b50565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461059f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b600060025414610617576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f43616e6e6f74207570646174652e00000000000000000000000000000000000081525060200191505060405180910390fd5b42811015610670576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806107776022913960400191505060405180910390fd5b8060028190555050565b61068460006106b9565b426001819055507fbf30e910dd2b6e24c75c800d9f3477674e89a4b45e366f87cd03c99e0ba6496160405160405180910390a1565b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f60405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505056fe54696d65706f696e742073686f756c6420626520696e20746865206675747572652ea2646970667358221220b22d4548cf7496084fa674f6a13be7f8f697a60a73a5b32a31550bf72357c4f664736f6c63430007060033";
