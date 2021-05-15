/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { DividendPool } from "../DividendPool";

export class DividendPool__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _gov: string,
    _RIGHT: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<DividendPool> {
    return super.deploy(_gov, _RIGHT, overrides || {}) as Promise<DividendPool>;
  }
  getDeployTransaction(
    _gov: string,
    _RIGHT: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_gov, _RIGHT, overrides || {});
  }
  attach(address: string): DividendPool {
    return super.attach(address) as DividendPool;
  }
  connect(signer: Signer): DividendPool__factory {
    return super.connect(signer) as DividendPool__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): DividendPool {
    return new Contract(address, _abi, signerOrProvider) as DividendPool;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_gov",
        type: "address",
      },
      {
        internalType: "address",
        name: "_RIGHT",
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
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "addToken",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    name: "claimBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "veLockId",
        type: "uint256",
      },
    ],
    name: "claimStartWeek",
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
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "claimUpTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
    ],
    name: "claimable",
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
        name: "",
        type: "address",
      },
    ],
    name: "distributable",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "distribute",
    outputs: [],
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
    name: "distributedToken",
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
    name: "distributedTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "_tokens",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "distributionBalance",
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
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "epochNum",
        type: "uint256",
      },
    ],
    name: "distributionOfWeek",
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
        name: "",
        type: "address",
      },
    ],
    name: "distributions",
    outputs: [
      {
        internalType: "uint256",
        name: "totalDistribution",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "epochUnit",
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
    name: "genesis",
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
    name: "getCurrentEpoch",
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
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "getEpoch",
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
    name: "getNextEpoch",
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
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "removeToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_admin",
        type: "address",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "totalDistributed",
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
    name: "veLocker",
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
    name: "veVISION",
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
];

const _bytecode =
  "0x60e0604052600060015560006002553480156200001b57600080fd5b5060405162001f6a38038062001f6a833981810160405260408110156200004157600080fd5b50805160209182015160008054336001600160a01b03199182168117909255600380549091169091179055606081901b6001600160601b031916608052604080516314f57a4b60e01b81529051929391926001600160a01b038416926314f57a4b9260048082019391829003018186803b158015620000bf57600080fd5b505afa158015620000d4573d6000803e3d6000fd5b505050506040513d6020811015620000eb57600080fd5b505160601b6001600160601b03191660a052620001148262000128602090811b62000b4c17901c565b62093a808042040260c052506200023e9050565b6000546001600160a01b0316331462000179576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b038116620001d5576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b620001e081620001e3565b50565b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b60805160601c60a05160601c60c051611ccc6200029e60003980610b2a5280610c57528061129c525080610677528061072f52806107d85280610e175280610ebf52806111eb525080610acc52806112c752806113a65250611ccc6000f3fe608060405234801561001057600080fd5b50600436106101da5760003560e01c80639353b9df11610104578063bc0bc6ba116100a2578063e3ba18a511610071578063e3ba18a5146105b2578063efe97d05146105de578063fb932108146105e6578063fd2dcecf14610612576101da565b8063bc0bc6ba146104af578063d48bfca7146104cc578063d4abe717146104f2578063de19d07914610595576101da565b8063ab033ea9116100de578063ab033ea91461041b578063ab646a4014610441578063b5aeafd81461047b578063b97dd9e2146104a7576101da565b80639353b9df146103cc5780639c724e241461040b578063a7f0b3de14610413576101da565b80634b0bddd21161017c578063605cfbb51161014b578063605cfbb51461038e57806366bfc1581461039657806368fe894c1461039e5780638b8dfa39146103a6576101da565b80634b0bddd2146102c5578063586360ce146102f35780635d9b436a1461034b5780635fa7b58414610368576101da565b806314f57a4b116101b857806314f57a4b146102675780631b343adc1461026f5780631e83409a14610279578063402914f51461029f576101da565b806310111b12146101df57806312d43a511461021d5780631325968314610241575b600080fd5b61020b600480360360408110156101f557600080fd5b506001600160a01b03813516906020013561061a565b60408051918252519081900360200190f35b610225610648565b604080516001600160a01b039092168252519081900360200190f35b61020b6004803603602081101561025757600080fd5b50356001600160a01b0316610657565b610225610675565b610277610699565b005b6102776004803603602081101561028f57600080fd5b50356001600160a01b03166106f3565b61020b600480360360208110156102b557600080fd5b50356001600160a01b0316610708565b610277600480360360408110156102db57600080fd5b506001600160a01b038135169060200135151561089f565b6102fb61091a565b60408051602080825283518183015283519192839290830191858101910280838360005b8381101561033757818101518382015260200161031f565b505050509050019250505060405180910390f35b6102256004803603602081101561036157600080fd5b503561097c565b6102776004803603602081101561037e57600080fd5b50356001600160a01b03166109a6565b610277610a19565b61020b610ac4565b610225610aca565b61020b600480360360208110156103bc57600080fd5b50356001600160a01b0316610aee565b6103f2600480360360208110156103e257600080fd5b50356001600160a01b0316610b09565b6040805192835260208301919091528051918290030190f35b61020b610b22565b61020b610b28565b6102776004803603602081101561043157600080fd5b50356001600160a01b0316610b4c565b6104676004803603602081101561045757600080fd5b50356001600160a01b0316610c00565b604080519115158252519081900360200190f35b61020b6004803603604081101561049157600080fd5b506001600160a01b038135169060200135610c15565b61020b610c41565b61020b600480360360208110156104c557600080fd5b5035610c51565b610277600480360360208110156104e257600080fd5b50356001600160a01b0316610c7d565b6102776004803603602081101561050857600080fd5b81019060208101813564010000000081111561052357600080fd5b82018360208201111561053557600080fd5b8035906020019184602083028401116401000000008311171561055757600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550610ced945050505050565b610277600480360360208110156105ab57600080fd5b5035610d1d565b610277600480360360408110156105c857600080fd5b506001600160a01b038135169060200135610e06565b61020b610f7b565b610277600480360360408110156105fc57600080fd5b506001600160a01b038135169060200135610f8d565b61020b611130565b6001600160a01b03821660009081526004602090815260408083208484526002019091529020545b92915050565b6000546001600160a01b031681565b6001600160a01b031660009081526004602052604090206001015490565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000546001600160a01b031633146106e9576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6106f1611137565b565b62093a7f1942016107048282610e06565b5050565b6001600160a01b038116600090815260046020526040812081610729610c41565b905060007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166370a08231336040518263ffffffff1660e01b815260040180826001600160a01b0316815260200191505060206040518083038186803b15801561079a57600080fd5b505afa1580156107ae573d6000803e3d6000fd5b505050506040513d60208110156107c457600080fd5b505190506000805b828110156108955760007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316632f745c5933846040518363ffffffff1660e01b815260040180836001600160a01b031681526020018281526020019250505060206040518083038186803b15801561084b57600080fd5b505afa15801561085f573d6000803e3d6000fd5b505050506040513d602081101561087557600080fd5b5051905061088886826000198801611170565b90920191506001016107cc565b5095945050505050565b6000546001600160a01b031633146108ef576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b03919091166000908152600760205260409020805460ff1916911515919091179055565b6060600680548060200260200160405190810160405280929190818152602001828054801561097257602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311610954575b5050505050905090565b6006818154811061098c57600080fd5b6000918252602090912001546001600160a01b0316905081565b3360009081526007602052604090205460ff16806109ce57506000546001600160a01b031633145b610a0d576040805162461bcd60e51b815260206004820152600b60248201526a139bdd08185b1b1bddd95960aa1b604482015290519081900360640190fd5b610a1681611463565b50565b600254610a6d576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b6002544210156106e9576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b60015481565b7f000000000000000000000000000000000000000000000000000000000000000081565b6001600160a01b031660009081526004602052604090205490565b6004602052600090815260409020805460019091015482565b60025481565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000546001600160a01b03163314610b9c576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b038116610bf7576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b610a16816114f1565b60056020526000908152604090205460ff1681565b6001600160a01b0391909116600090815260046020908152604080832093835260039093019052205490565b6000610c4c42610c51565b905090565b62093a807f00000000000000000000000000000000000000000000000000000000000000009091030490565b3360009081526007602052604090205460ff1680610ca557506000546001600160a01b031633145b610ce4576040805162461bcd60e51b815260206004820152600b60248201526a139bdd08185b1b1bddd95960aa1b604482015290519081900360640190fd5b610a1681611559565b60005b815181101561070457610d15828281518110610d0857fe5b60200260200101516106f3565b600101610cf0565b6000546001600160a01b03163314610d6d576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b60025415610dc2576040805162461bcd60e51b815260206004820152600e60248201527f43616e6e6f74207570646174652e000000000000000000000000000000000000604482015290519081900360640190fd5b42811015610e015760405162461bcd60e51b8152600401808060200182810382526022815260200180611c756022913960400191505060405180910390fd5b600255565b6000610e1182610c51565b905060007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166370a08231336040518263ffffffff1660e01b815260040180826001600160a01b0316815260200191505060206040518083038186803b158015610e8257600080fd5b505afa158015610e96573d6000803e3d6000fd5b505050506040513d6020811015610eac57600080fd5b5051905060005b81811015610f745760007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316632f745c5933846040518363ffffffff1660e01b815260040180836001600160a01b031681526020018281526020019250505060206040518083038186803b158015610f3257600080fd5b505afa158015610f46573d6000803e3d6000fd5b505050506040513d6020811015610f5c57600080fd5b50519050610f6b8682866116bb565b50600101610eb3565b5050505050565b6000610f85610c41565b600101905090565b6001600160a01b03821660009081526005602052604090205460ff16610fe8576040805162461bcd60e51b815260206004820152600b60248201526a139bdd08185b1b1bddd95960aa1b604482015290519081900360640190fd5b610ffd6001600160a01b03831633308461170b565b6000826001600160a01b03166370a08231306040518263ffffffff1660e01b815260040180826001600160a01b0316815260200191505060206040518083038186803b15801561104c57600080fd5b505afa158015611060573d6000803e3d6000fd5b505050506040513d602081101561107657600080fd5b50516001600160a01b03841660009081526004602052604090208054919250906110f357600680546001810182556000919091527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f01805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0386161790555b60018101805490839055815490830390810182556000611111610c41565b6000908152600290930160205250604090912080549091019055505050565b62093a8081565b61114160006114f1565b426001556040517fbf30e910dd2b6e24c75c800d9f3477674e89a4b45e366f87cd03c99e0ba6496190600090a1565b60008061117b610c41565b90508083106111d1576040805162461bcd60e51b815260206004820152601f60248201527f43757272656e742065706f6368206973206265696e6720757064617465642e00604482015290519081900360640190fd5b60008481526003860160205260408120548061128b5760007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663f4dadc61886040518263ffffffff1660e01b81526004018082815260200191505060606040518083038186803b15801561124d57600080fd5b505afa158015611261573d6000803e3d6000fd5b505050506040513d606081101561127757600080fd5b5060200151905061128781610c51565b9150505b84811161145757600062093a8082027f00000000000000000000000000000000000000000000000000000000000000000162093a8001905060007f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316634ee2cd7e33846040518363ffffffff1660e01b815260040180836001600160a01b031681526020018281526020019250505060206040518083038186803b15801561133a57600080fd5b505afa15801561134e573d6000803e3d6000fd5b505050506040513d602081101561136457600080fd5b5051604080517f981b24d00000000000000000000000000000000000000000000000000000000081526004810185905290519192506000916001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169163981b24d0916024808301926020929190829003018186803b1580156113ec57600080fd5b505afa158015611400573d6000803e3d6000fd5b505050506040513d602081101561141657600080fd5b50519050801561144c57600084815260028b0160205260409020546114479082906114419085611799565b906117f2565b850194505b50505060010161128b565b509150505b9392505050565b6001600160a01b03811660009081526005602052604090205460ff166114d0576040805162461bcd60e51b815260206004820152601460248201527f546f6b656e206e6f742072656769737465726564000000000000000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600560205260409020805460ff19169055565b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a36000805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b6001600160a01b03811660009081526005602052604090205460ff16156115c7576040805162461bcd60e51b815260206004820152601860248201527f546f6b656e20616c726561647920726567697374657265640000000000000000604482015290519081900360640190fd5b6001600160a01b0381166000908152600560209081526040808320805460ff191660011790556006805482518185028101850190935280835261165593869392919083018282801561164257602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311611624575b505050505061185990919063ffffffff16565b5090508061070457600680546001810182556000919091527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f0180546001600160a01b03841673ffffffffffffffffffffffffffffffffffffffff199091161790555050565b6001600160a01b0383166000908152600460205260408120906116df828585611170565b600085815260038401602052604090206001850190559050610f746001600160a01b03861633836118b1565b604080516001600160a01b0380861660248301528416604482015260648082018490528251808303909101815260849091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f23b872dd00000000000000000000000000000000000000000000000000000000179052611793908590611936565b50505050565b6000826117a857506000610642565b828202828482816117b557fe5b041461145c5760405162461bcd60e51b8152600401808060200182810382526021815260200180611c2a6021913960400191505060405180910390fd5b6000808211611848576040805162461bcd60e51b815260206004820152601a60248201527f536166654d6174683a206469766973696f6e206279207a65726f000000000000604482015290519081900360640190fd5b81838161185157fe5b049392505050565b60008060005b84518110156118a857836001600160a01b031685828151811061187e57fe5b60200260200101516001600160a01b031614156118a0576001925090506118aa565b60010161185f565b505b9250929050565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb00000000000000000000000000000000000000000000000000000000179052611931908490611936565b505050565b600061198b826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166119e79092919063ffffffff16565b805190915015611931578080602001905160208110156119aa57600080fd5b50516119315760405162461bcd60e51b815260040180806020018281038252602a815260200180611c4b602a913960400191505060405180910390fd5b60606119f684846000856119fe565b949350505050565b606082471015611a3f5760405162461bcd60e51b8152600401808060200182810382526026815260200180611c046026913960400191505060405180910390fd5b611a4885611b59565b611a99576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b600080866001600160a01b031685876040518082805190602001908083835b60208310611ad75780518252601f199092019160209182019101611ab8565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d8060008114611b39576040519150601f19603f3d011682016040523d82523d6000602084013e611b3e565b606091505b5091509150611b4e828286611b5f565b979650505050505050565b3b151590565b60608315611b6e57508161145c565b825115611b7e5782518084602001fd5b8160405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015611bc8578181015183820152602001611bb0565b50505050905090810190601f168015611bf55780820380516001836020036101000a031916815260200191505b509250505060405180910390fdfe416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f775361666545524332303a204552433230206f7065726174696f6e20646964206e6f74207375636365656454696d65706f696e742073686f756c6420626520696e20746865206675747572652ea264697066735822122054853a73d0a17405e4e3b947c4bfe04d5ed5766682cee95cea2b709c2e2a989564736f6c63430007060033";
