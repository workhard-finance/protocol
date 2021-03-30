/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { VisionTokenEmitter } from "../VisionTokenEmitter";

export class VisionTokenEmitter__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _devShares: string,
    _protocolFund: string,
    _gov: string,
    _visionToken: string,
    _burnMiningPoolFactory: string,
    _stakeMiningPoolFactory: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<VisionTokenEmitter> {
    return super.deploy(
      _devShares,
      _protocolFund,
      _gov,
      _visionToken,
      _burnMiningPoolFactory,
      _stakeMiningPoolFactory,
      overrides || {}
    ) as Promise<VisionTokenEmitter>;
  }
  getDeployTransaction(
    _devShares: string,
    _protocolFund: string,
    _gov: string,
    _visionToken: string,
    _burnMiningPoolFactory: string,
    _stakeMiningPoolFactory: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _devShares,
      _protocolFund,
      _gov,
      _visionToken,
      _burnMiningPoolFactory,
      _stakeMiningPoolFactory,
      overrides || {}
    );
  }
  attach(address: string): VisionTokenEmitter {
    return super.attach(address) as VisionTokenEmitter;
  }
  connect(signer: Signer): VisionTokenEmitter__factory {
    return super.connect(signer) as VisionTokenEmitter__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VisionTokenEmitter {
    return new Contract(address, _abi, signerOrProvider) as VisionTokenEmitter;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_devShares",
        type: "address",
      },
      {
        internalType: "address",
        name: "_protocolFund",
        type: "address",
      },
      {
        internalType: "address",
        name: "_gov",
        type: "address",
      },
      {
        internalType: "address",
        name: "_visionToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_burnMiningPoolFactory",
        type: "address",
      },
      {
        internalType: "address",
        name: "_stakeMiningPoolFactory",
        type: "address",
      },
    ],
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
        indexed: false,
        internalType: "uint256",
        name: "newPeriod",
        type: "uint256",
      },
    ],
    name: "EmissionPeriodUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "rate",
        type: "uint256",
      },
    ],
    name: "EmissionRateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "numberOfPools",
        type: "uint256",
      },
    ],
    name: "EmissionWeightUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "baseToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "NewBurnMiningPool",
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "baseToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "NewStakeMiningPool",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "Start",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TokenEmission",
    type: "event",
  },
  {
    inputs: [],
    name: "DENOMINATOR",
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
    name: "INITIAL_EMISSION",
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
    name: "burnMiningPoolFactory",
    outputs: [
      {
        internalType: "contract IMiningPoolFactory",
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
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "burnMiningPools",
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
    inputs: [],
    name: "dev",
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
    inputs: [],
    name: "emissionStarted",
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
    name: "emissionWeekNum",
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
    name: "emissionWeight",
    outputs: [
      {
        internalType: "uint256",
        name: "protocolFund",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "caller",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "dev",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sum",
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
    inputs: [
      {
        internalType: "uint256",
        name: "poolIndex",
        type: "uint256",
      },
    ],
    name: "getPoolWeight",
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
    inputs: [],
    name: "minEmissionRatePerWeek",
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
        internalType: "address",
        name: "_burningToken",
        type: "address",
      },
    ],
    name: "newBurnMiningPool",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_stakingToken",
        type: "address",
      },
    ],
    name: "newStakeMiningPool",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "pools",
    outputs: [
      {
        internalType: "contract IMiningPool",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolFund",
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
        internalType: "address[]",
        name: "_miningPools",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "_weights",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "_protocolFund",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_caller",
        type: "uint256",
      },
    ],
    name: "setEmission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "period",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "rate",
        type: "uint256",
      },
    ],
    name: "setMinimumRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_fund",
        type: "address",
      },
    ],
    name: "setProtocolFund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "stakeMiningPoolFactory",
    outputs: [
      {
        internalType: "contract IMiningPoolFactory",
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
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "stakeMiningPools",
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
    inputs: [],
    name: "start",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "visionToken",
    outputs: [
      {
        internalType: "contract VisionToken",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405260006001556000600255603c60035562093a806009553480156200002757600080fd5b50604051620033d8380380620033d8833981810160405260c08110156200004d57600080fd5b81019080805190602001909291908051906020019092919080519060200190929190805190602001909291908051906020019092919080519060200190929190505050336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550620000e1856200021760201b60201c565b82600460006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555081600560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600660006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550620001b5866200031d60201b60201c565b600760006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506200020b846200057960201b6200122b1760201c565b505050505050620007b0565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614620002d9576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b80600860006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600080600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16637fd9a840600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16308660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff166040518563ffffffff1660e01b8152600401808573ffffffffffffffffffffffffffffffffffffffff1681526020018473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff168152602001945050505050602060405180830381600087803b1580156200044857600080fd5b505af11580156200045d573d6000803e3d6000fd5b505050506040513d60208110156200047457600080fd5b8101908080519060200190929190505050905080600b60008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507f4205efd639890993ef4f1c4cdc3b285e95951e80f1e2c8dfe89845f48d89d85b8382604051808373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a180915050919050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146200063b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415620006df576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260188152602001807f55736520616e61726368697a65282920696e73746561642e000000000000000081525060200191505060405180910390fd5b620006f081620006f360201b60201c565b50565b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f60405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b612c1880620007c06000396000f3fe608060405234801561001057600080fd5b50600436106101e55760003560e01c806391cca3db1161010f578063bca46bc2116100a2578063e4fc6b6d11610071578063e4fc6b6d14610725578063ec2178701461072f578063f0e6680c1461088f578063f2fd83e0146108fd576101e5565b8063bca46bc214610686578063be9a6555146106ba578063d82b474e146106c4578063de19d079146106f7576101e5565b8063ab033ea9116100de578063ab033ea914610548578063ac4afa381461058c578063b2e60b4a146105e4578063b7b246b014610652576101e5565b806391cca3db146104aa578063991f2fac146104de5780639c724e241461050c578063a5fbe1b71461052a576101e5565b80635d7de7ad1161018757806369af98311161015657806369af98311461040e5780636aef1b901461042c5780638fd4a5a41461044a578063918f86741461048c576101e5565b80635d7de7ad14610344578063605cfbb5146103785780636265d4581461038257806366bfc158146103f0576101e5565b806316177019116101c357806316177019146102805780631b343adc146102ae57806334ab0cec146102b85780634f1c5b3414610326576101e5565b806304d1ad11146101ea5780630697cce91461020857806312d43a511461024c575b600080fd5b6101f2610931565b6040518082815260200191505060405180910390f35b61024a6004803603602081101561021e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610940565b005b610254610a45565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6102ac6004803603602081101561029657600080fd5b8101908080359060200190929190505050610a69565b005b6102b6610bc5565b005b6102fa600480360360208110156102ce57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610c90565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61032e610ee9565b6040518082815260200191505060405180910390f35b61034c610eef565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610380610f15565b005b6103c46004803603602081101561039857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611010565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103f8611043565b6040518082815260200191505060405180910390f35b610416611049565b6040518082815260200191505060405180910390f35b61043461104f565b6040518082815260200191505060405180910390f35b6104766004803603602081101561046057600080fd5b8101908080359060200190929190505050611055565b6040518082815260200191505060405180910390f35b610494611079565b6040518082815260200191505060405180910390f35b6104b261107f565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61050a600480360360208110156104f457600080fd5b81019080803590602001909291905050506110a5565b005b61051461121f565b6040518082815260200191505060405180910390f35b610532611225565b6040518082815260200191505060405180910390f35b61058a6004803603602081101561055e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061122b565b005b6105b8600480360360208110156105a257600080fd5b810190808035906020019092919050505061139b565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610626600480360360208110156105fa57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506113da565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61065a61140d565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61068e611433565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6106c2611459565b005b6106cc61154f565b6040518085815260200184815260200183815260200182815260200194505050505060405180910390f35b6107236004803603602081101561070d57600080fd5b810190808035906020019092919050505061156d565b005b61072d611709565b005b61088d6004803603608081101561074557600080fd5b810190808035906020019064010000000081111561076257600080fd5b82018360208201111561077457600080fd5b8035906020019184602083028401116401000000008311171561079657600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600081840152601f19601f820116905080830192505050505050509192919290803590602001906401000000008111156107f657600080fd5b82018360208201111561080857600080fd5b8035906020019184602083028401116401000000008311171561082a57600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600081840152601f19601f8201169050808301925050505050505091929192908035906020019092919080359060200190929190505050611d49565b005b6108d1600480360360208110156108a557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061239e565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6109056125f7565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6a13da329b6336471800000081565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610a01576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b80600860006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610b2a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b6086811115610b84576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603c815260200180612b16603c913960400191505060405180910390fd5b806003819055507fffcc630bf88a67ba7c8b27440787c31777ae923aee1e9bbd0127feea56da2cd0816040518082815260200191505060405180910390a150565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610c86576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b610c8e61261d565b565b600080600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16637fd9a840600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16308660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff166040518563ffffffff1660e01b8152600401808573ffffffffffffffffffffffffffffffffffffffff1681526020018473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff168152602001945050505050602060405180830381600087803b158015610dba57600080fd5b505af1158015610dce573d6000803e3d6000fd5b505050506040513d6020811015610de457600080fd5b8101908080519060200190929190505050905080600c60008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507fe1e6051678875790c118eda2c71fb47fd45fd6839feaa39b17f961fd2d2f84f98382604051808373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a180915050919050565b60125481565b600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60006002541415610f8e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260168152602001807f43616e6e6f742064697362616e642074686520676f760000000000000000000081525060200191505060405180910390fd5b600254421015611006576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260168152602001807f43616e6e6f742064697362616e642074686520676f760000000000000000000081525060200191505060405180910390fd5b61100e61261d565b565b600c6020528060005260406000206000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60015481565b60035481565b60135481565b6000600d600001828154811061106757fe5b90600052602060002001549050919050565b61271081565b600760009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614611166576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b8060095414156111de576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260098152602001807f6e6f20757064617465000000000000000000000000000000000000000000000081525060200191505060405180910390fd5b806009819055507f4e7576ad8d27551bd7fd7e10cd138c0d3119f748bff60364c43e05b389acb2d1816040518082815260200191505060405180910390a150565b60025481565b60095481565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146112ec576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561138f576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260188152602001807f55736520616e61726368697a65282920696e73746561642e000000000000000081525060200191505060405180910390fd5b6113988161265c565b50565b600a81815481106113ab57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600b6020528060005260406000206000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461151a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b426012819055507f1b55ba3aa851a46be3b365aee5b5c140edd620d578922f3e8466d2cbd96f954b60405160405180910390a1565b600d8060010154908060020154908060030154908060040154905084565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461162e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b6000600254146116a6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f43616e6e6f74207570646174652e00000000000000000000000000000000000081525060200191505060405180910390fd5b428110156116ff576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180612bc16022913960400191505060405180910390fd5b8060028190555050565b60006117346009546117266012544261271990919063ffffffff16565b61279c90919063ffffffff16565b90506013548111611790576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180612b9f6022913960400191505060405180910390fd5b806013819055506000611864612710611856600354600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b15801561180d57600080fd5b505afa158015611821573d6000803e3d6000fd5b505050506040513d602081101561183757600080fd5b810190808051906020019092919050505061282590919063ffffffff16565b61279c90919063ffffffff16565b9050600061188d600184036001901b6a13da329b6336471800000061279c90919063ffffffff16565b9050600061189b82846128ab565b90506000600d6004015490506000600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b15801561191157600080fd5b505afa158015611925573d6000803e3d6000fd5b505050506040513d602081101561193b57600080fd5b8101908080519060200190929190505050905060005b600d60000180549050811015611a6d57600a8054905081106119db576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600c8152602001807f6f7574206f6620696e646578000000000000000000000000000000000000000081525060200191505060405180910390fd5b6000611a1c84611a0e87600d60000186815481106119f557fe5b906000526020600020015461282590919063ffffffff16565b61279c90919063ffffffff16565b9050611a5f600a8381548110611a2e57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16826128c5565b508080600101915050611951565b50600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166340c10f19600860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16611af985611aeb88600d6001015461282590919063ffffffff16565b61279c90919063ffffffff16565b6040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050600060405180830381600087803b158015611b4c57600080fd5b505af1158015611b60573d6000803e3d6000fd5b50505050600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166340c10f1933611bcd85611bbf88600d6002015461282590919063ffffffff16565b61279c90919063ffffffff16565b6040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050600060405180830381600087803b158015611c2057600080fd5b505af1158015611c34573d6000803e3d6000fd5b50505050611d0a600760009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1682600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b158015611cc757600080fd5b505afa158015611cdb573d6000803e3d6000fd5b505050506040513d6020811015611cf157600080fd5b81019080805190602001909291905050500385036128c5565b7fa520955117bcc21cb6b9206478092cc311962d4333ecd8f3d142fdee8b912acd836040518082815260200191505060405180910390a1505050505050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614611e0a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600e8152602001807f4e6f7420617574686f72697a656400000000000000000000000000000000000081525060200191505060405180910390fd5b8251845114611e64576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526021815260200180612ad46021913960400191505060405180910390fd5b6000845167ffffffffffffffff81118015611e7e57600080fd5b50604051908082528060200260200182016040528015611ead5781602001602082028036833780820191505090505b5090506000828401905060005b86518110156121d2576000878281518110611ed157fe5b6020026020010151905060008173ffffffffffffffffffffffffffffffffffffffff1663c55dae636040518163ffffffff1660e01b815260040160206040518083038186803b158015611f2357600080fd5b505afa158015611f37573d6000803e3d6000fd5b505050506040513d6020811015611f4d57600080fd5b810190808051906020019092919050505090508173ffffffffffffffffffffffffffffffffffffffff16600c60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614158061208557508173ffffffffffffffffffffffffffffffffffffffff16600b60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614155b6120da576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252604d815260200180612b52604d913960600191505060405180910390fd5b6127108884815181106120e957fe5b602002602001015110612164576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260108152602001807f70726576656e74206f766572666c6f770000000000000000000000000000000081525060200191505060405180910390fd5b8185848151811061217157fe5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508783815181106121b757fe5b60200260200101518401935050508080600101915050611eba565b50612710841061224a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260108152602001807f70726576656e74206f766572666c6f770000000000000000000000000000000081525060200191505060405180910390fd5b61271083106122c1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260108152602001807f70726576656e74206f766572666c6f770000000000000000000000000000000081525060200191505060405180910390fd5b6000601482816122cd57fe5b049050808201915082600a90805190602001906122eb9291906129df565b506040518060a0016040528087815260200186815260200185815260200182815260200183815250600d6000820151816000019080519060200190612331929190612a69565b50602082015181600101556040820151816002015560608201518160030155608082015181600401559050507faaabefee88b27f6ef3057e4fdf3039eb328f9f1530f93eb42d8860c001ae60b583516040518082815260200191505060405180910390a150505050505050565b600080600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16637fd9a840600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16308660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff166040518563ffffffff1660e01b8152600401808573ffffffffffffffffffffffffffffffffffffffff1681526020018473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff168152602001945050505050602060405180830381600087803b1580156124c857600080fd5b505af11580156124dc573d6000803e3d6000fd5b505050506040513d60208110156124f257600080fd5b8101908080519060200190929190505050905080600b60008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507f4205efd639890993ef4f1c4cdc3b285e95951e80f1e2c8dfe89845f48d89d85b8382604051808373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a180915050919050565b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b612627600061265c565b426001819055507fbf30e910dd2b6e24c75c800d9f3477674e89a4b45e366f87cd03c99e0ba6496160405160405180910390a1565b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f60405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600082821115612791576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f536166654d6174683a207375627472616374696f6e206f766572666c6f77000081525060200191505060405180910390fd5b818303905092915050565b6000808211612813576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f536166654d6174683a206469766973696f6e206279207a65726f00000000000081525060200191505060405180910390fd5b81838161281c57fe5b04905092915050565b60008083141561283857600090506128a5565b600082840290508284828161284957fe5b04146128a0576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526021815260200180612af56021913960400191505060405180910390fd5b809150505b92915050565b6000818310156128bb57816128bd565b825b905092915050565b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166340c10f1983836040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050600060405180830381600087803b15801561295857600080fd5b505af115801561296c573d6000803e3d6000fd5b505050508173ffffffffffffffffffffffffffffffffffffffff166390ca796b826040518263ffffffff1660e01b815260040180828152602001915050600060405180830381600087803b1580156129c357600080fd5b505af11580156129d7573d6000803e3d6000fd5b505050505050565b828054828255906000526020600020908101928215612a58579160200282015b82811115612a575782518260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550916020019190600101906129ff565b5b509050612a659190612ab6565b5090565b828054828255906000526020600020908101928215612aa5579160200282015b82811115612aa4578251825591602001919060010190612a89565b5b509050612ab29190612ab6565b5090565b5b80821115612acf576000816000905550600101612ab7565b509056fe426f74682073686f756c642068617665207468652073616d65206c656e6774682e536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7750726f746563742066726f6d20746865207375706572696e666c6174696f6e6172792839392e38252070657220796561722920736974756174696f6e546865206d696e696e6720706f6f6c2073686f756c64206265206372656174656420766961206e65774275726e4d696e696e67506f6f6c206f72206e65775374616b654d696e696e67506f6f6c416c7265616479206d696e746564206f72206e6f742073746172746564207965742e54696d65706f696e742073686f756c6420626520696e20746865206675747572652ea2646970667358221220543f3569cbba1d61c3ee2f591f3d185b3e129dd1c9f7257cd0e6f21033bfce1f64736f6c63430007060033";