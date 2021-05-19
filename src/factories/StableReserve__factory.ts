/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { StableReserve } from "../StableReserve";

export class StableReserve__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _gov: string,
    _commitToken: string,
    _baseCurrency: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<StableReserve> {
    return super.deploy(
      _gov,
      _commitToken,
      _baseCurrency,
      overrides || {}
    ) as Promise<StableReserve>;
  }
  getDeployTransaction(
    _gov: string,
    _commitToken: string,
    _baseCurrency: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _gov,
      _commitToken,
      _baseCurrency,
      overrides || {}
    );
  }
  attach(address: string): StableReserve {
    return super.attach(address) as StableReserve;
  }
  connect(signer: Signer): StableReserve__factory {
    return super.connect(signer) as StableReserve__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): StableReserve {
    return new Contract(address, _abi, signerOrProvider) as StableReserve;
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
        name: "_commitToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_baseCurrency",
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
        name: "minter",
        type: "address",
      },
    ],
    name: "MinterUpdated",
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
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Recovered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Redeemed",
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
    name: "baseCurrency",
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
    name: "commitToken",
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
        name: "_contract",
        type: "address",
      },
    ],
    name: "disable",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_contract",
        type: "address",
      },
    ],
    name: "disablePermanently",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_contract",
        type: "address",
      },
    ],
    name: "enable",
    outputs: [],
    stateMutability: "nonpayable",
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
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "grant",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "minter",
        type: "address",
      },
    ],
    name: "init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "mintable",
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
    name: "minters",
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
        name: "",
        type: "address",
      },
    ],
    name: "nonRecoverable",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "payInsteadOfWorking",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "permanentlyNonRecoverable",
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
    inputs: [],
    name: "priceOfCOMMIT",
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
        name: "tokenAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
    ],
    name: "recoverERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "recoverer",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "redeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "reserveAndMint",
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
        name: "minter",
        type: "address",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
    ],
    name: "setMinter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_recoverer",
        type: "address",
      },
    ],
    name: "setRecoverer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60a060405260006004556000600555614e206008553480156200002157600080fd5b5060405162001e4038038062001e40833981810160405260608110156200004757600080fd5b50805160208083015160409093015160028054336001600160a01b0319918216811790925560038054821683179055600680548216909217909155600780549091166001600160a01b038616179055606081901b6001600160601b03191660805291929190620000c290829062000138811b6200072117901c565b620000d8826200013860201b620007211760201c565b620000ee83620001bc60201b620011d91760201c565b62000104836200023e60201b62000ad71760201c565b600a80546001600160a01b031916331790556003546200012f906001600160a01b03166001620002f9565b505050620003dc565b6002546001600160a01b0316331462000198576040805162461bcd60e51b815260206004820152601960248201527f4f6e6c7920616c6c6f77656420746f207265636f766572657200000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152602081905260409020805460ff19166001179055565b6002546001600160a01b031633146200021c576040805162461bcd60e51b815260206004820152601960248201527f4f6e6c7920616c6c6f77656420746f207265636f766572657200000000000000604482015290519081900360640190fd5b600280546001600160a01b0319166001600160a01b0392909216919091179055565b6003546001600160a01b031633146200028f576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b038116620002eb576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b620002f68162000380565b50565b6001600160a01b03821660009081526009602052604090205460ff1615158115151462000355576040516001600160a01b038316907fad0f299ec81a386c98df0ac27dae11dd020ed1b56963c53a7292e7a3a314539a90600090a25b6001600160a01b03919091166000908152600960205260409020805460ff1916911515919091179055565b6003546040516001600160a01b038084169216907f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f90600090a3600380546001600160a01b0319166001600160a01b0392909216919091179055565b60805160601c611a326200040e6000398061069c52806108b75280610aaf5280610f5252806111a75250611a326000f3fe608060405234801561001057600080fd5b50600436106101ae5760003560e01c80639c724e24116100ee578063db006a7511610097578063eaa2cabb11610071578063eaa2cabb14610497578063ed63058d146104b4578063f46eccc4146104da578063fabed4d614610229576101ae565b8063db006a7514610437578063de19d07914610454578063e6c09edf14610471576101ae565b8063cacc4b02116100c8578063cacc4b0214610328578063cf456ae71461034e578063dad0ac8f1461037c576101ae565b80639c724e24146102f2578063ab033ea9146102fa578063b808dce814610320576101ae565b8063605cfbb51161015b5780637c9e1e57116101355780637c9e1e571461027c5780638980f11f146102845780638fa0f3b3146102b057806392a85fde146102ea576101ae565b8063605cfbb51461024f57806366bfc158146102575780636be698df1461025f576101ae565b80634549ca2e1161018c5780634549ca2e146102075780634bf365df146102215780635bfa1b6814610229576101ae565b806312d43a51146101b357806319ab453c146101d75780631b343adc146101ff575b600080fd5b6101bb610500565b604080516001600160a01b039092168252519081900360200190f35b6101fd600480360360208110156101ed57600080fd5b50356001600160a01b031661050f565b005b6101fd610599565b61020f6105f3565b60408051918252519081900360200190f35b61020f6105f9565b6101fd6004803603602081101561023f57600080fd5b50356001600160a01b0316610721565b6101fd6107a4565b61020f61084f565b6101fd6004803603602081101561027557600080fd5b5035610855565b6101bb6108ec565b6101fd6004803603604081101561029a57600080fd5b506001600160a01b0381351690602001356108fb565b6102d6600480360360208110156102c657600080fd5b50356001600160a01b0316610a98565b604080519115158252519081900360200190f35b6101bb610aad565b61020f610ad1565b6101fd6004803603602081101561031057600080fd5b50356001600160a01b0316610ad7565b6101bb610b8b565b6102d66004803603602081101561033e57600080fd5b50356001600160a01b0316610b9a565b6101fd6004803603604081101561036457600080fd5b506001600160a01b0381351690602001351515610baf565b6101fd6004803603606081101561039257600080fd5b6001600160a01b03823516916020810135918101906060810160408201356401000000008111156103c257600080fd5b8201836020820111156103d457600080fd5b803590602001918460018302840111640100000000831117156103f657600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610c0d945050505050565b6101fd6004803603602081101561044d57600080fd5b5035610de0565b6101fd6004803603602081101561046a57600080fd5b5035611006565b6101fd6004803603602081101561048757600080fd5b50356001600160a01b03166110ef565b6101fd600480360360208110156104ad57600080fd5b5035611175565b6101fd600480360360208110156104ca57600080fd5b50356001600160a01b03166111d9565b6102d6600480360360208110156104f057600080fd5b50356001600160a01b0316611267565b6003546001600160a01b031681565b6006546001600160a01b0316331461056e576040805162461bcd60e51b815260206004820181905260248201527f4f6e6c7920616c6c6f77656420746f2074686520696e6974696c61697a65722e604482015290519081900360640190fd5b61057981600161127c565b506006805473ffffffffffffffffffffffffffffffffffffffff19169055565b6003546001600160a01b031633146105e9576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6105f1611302565b565b60085481565b600080600760009054906101000a90046001600160a01b03166001600160a01b03166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b15801561064a57600080fd5b505afa15801561065e573d6000803e3d6000fd5b505050506040513d602081101561067457600080fd5b5051604080516370a0823160e01b815230600482015290519192506000916001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016916370a08231916024808301926020929190829003018186803b1580156106e257600080fd5b505afa1580156106f6573d6000803e3d6000fd5b505050506040513d602081101561070c57600080fd5b5051905061071a818361133b565b9250505090565b6002546001600160a01b03163314610780576040805162461bcd60e51b815260206004820152601960248201527f4f6e6c7920616c6c6f77656420746f207265636f766572657200000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152602081905260409020805460ff19166001179055565b6005546107f8576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b6005544210156105e9576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b60045481565b3360009081526009602052604090205460ff166108aa576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6108df6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001633308461139d565b6108e93382611410565b50565b6007546001600160a01b031681565b6002546001600160a01b0316331461095a576040805162461bcd60e51b815260206004820152601960248201527f4f6e6c7920616c6c6f77656420746f207265636f766572657200000000000000604482015290519081900360640190fd5b6001600160a01b03821660009081526001602052604090205460ff16156109c8576040805162461bcd60e51b815260206004820152601560248201527f4e6f6e2d7265636f76657261626c652045524332300000000000000000000000604482015290519081900360640190fd5b6001600160a01b03821660009081526020819052604090205460ff1615610a36576040805162461bcd60e51b815260206004820152601560248201527f4e6f6e2d7265636f76657261626c652045524332300000000000000000000000604482015290519081900360640190fd5b600254610a50906001600160a01b038481169116836114f6565b604080516001600160a01b03841681526020810183905281517f8c1256b8896378cd5044f80c202f9772b9d77dc85c8a6eb51967210b09bfaa28929181900390910190a15050565b60016020526000908152604090205460ff1681565b7f000000000000000000000000000000000000000000000000000000000000000081565b60055481565b6003546001600160a01b03163314610b27576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b038116610b82576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b6108e98161154d565b6002546001600160a01b031681565b60006020819052908152604090205460ff1681565b6003546001600160a01b03163314610bff576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b610c09828261127c565b5050565b6003546001600160a01b03163314610c5d576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b610c678383611410565b6007546040516001600160a01b039091166024820181815260448301859052606060648401908152845160848501528451600094610d7e947fd76a093b000000000000000000000000000000000000000000000000000000009490938993899360a4019060208501908083838d5b83811015610ced578181015183820152602001610cd5565b50505050905090810190601f168015610d1a5780820380516001836020036101000a031916815260200191505b50945050505050604051602081830303815290604052906001600160e01b0319166020820180516001600160e01b03838183161783525050505060405180606001604052806024815260200161198d602491396001600160a01b03871691906115b6565b805190915015610dda57808060200190516020811015610d9d57600080fd5b5051610dda5760405162461bcd60e51b815260040180806020018281038252602481526020018061198d6024913960400191505060405180910390fd5b50505050565b600754604080516370a0823160e01b8152336004820152905183926001600160a01b0316916370a08231916024808301926020929190829003018186803b158015610e2a57600080fd5b505afa158015610e3e573d6000803e3d6000fd5b505050506040513d6020811015610e5457600080fd5b50511015610ea9576040805162461bcd60e51b815260206004820152601260248201527f4e6f7420656e6f7567682062616c616e63650000000000000000000000000000604482015290519081900360640190fd5b600754604080517f79cc67900000000000000000000000000000000000000000000000000000000081523360048201526024810184905290516001600160a01b03909216916379cc67909160448082019260009290919082900301818387803b158015610f1557600080fd5b505af1158015610f29573d6000803e3d6000fd5b50506040805163a9059cbb60e01b81523360048201526024810185905290516001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016935063a9059cbb925060448083019260209291908290030181600087803b158015610f9c57600080fd5b505af1158015610fb0573d6000803e3d6000fd5b505050506040513d6020811015610fc657600080fd5b5050604080513381526020810183905281517f4896181ff8f4543cc00db9fe9b6fb7e6f032b7eb772c72ab1ec1b4d2e03b9369929181900390910190a150565b6003546001600160a01b03163314611056576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b600554156110ab576040805162461bcd60e51b815260206004820152600e60248201527f43616e6e6f74207570646174652e000000000000000000000000000000000000604482015290519081900360640190fd5b428110156110ea5760405162461bcd60e51b81526004018080602001828103825260228152602001806119db6022913960400191505060405180910390fd5b600555565b6002546001600160a01b0316331461114e576040805162461bcd60e51b815260206004820152601960248201527f4f6e6c7920616c6c6f77656420746f207265636f766572657200000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600160208190526040909120805460ff19169091179055565b6000611198612710611192600854856115cf90919063ffffffff16565b90611628565b90506111cf6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001633308461139d565b610c093383611410565b6002546001600160a01b03163314611238576040805162461bcd60e51b815260206004820152601960248201527f4f6e6c7920616c6c6f77656420746f207265636f766572657200000000000000604482015290519081900360640190fd5b6002805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b60096020526000908152604090205460ff1681565b6001600160a01b03821660009081526009602052604090205460ff161515811515146112d7576040516001600160a01b038316907fad0f299ec81a386c98df0ac27dae11dd020ed1b56963c53a7292e7a3a314539a90600090a25b6001600160a01b03919091166000908152600960205260409020805460ff1916911515919091179055565b61130c600061154d565b426004556040517fbf30e910dd2b6e24c75c800d9f3477674e89a4b45e366f87cd03c99e0ba6496190600090a1565b600082821115611392576040805162461bcd60e51b815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b508082035b92915050565b604080516001600160a01b0380861660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03167f23b872dd00000000000000000000000000000000000000000000000000000000179052610dda90859061168f565b6114186105f9565b81111561146c576040805162461bcd60e51b815260206004820152600d60248201527f4f7574206f662062756467657400000000000000000000000000000000000000604482015290519081900360640190fd5b600754604080517f40c10f190000000000000000000000000000000000000000000000000000000081526001600160a01b03858116600483015260248201859052915191909216916340c10f1991604480830192600092919082900301818387803b1580156114da57600080fd5b505af11580156114ee573d6000803e3d6000fd5b505050505050565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180516001600160e01b031663a9059cbb60e01b17905261154890849061168f565b505050565b6003546040516001600160a01b038084169216907f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f90600090a36003805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b60606115c58484600085611740565b90505b9392505050565b6000826115de57506000611397565b828202828482816115eb57fe5b04146115c85760405162461bcd60e51b815260040180806020018281038252602181526020018061196c6021913960400191505060405180910390fd5b600080821161167e576040805162461bcd60e51b815260206004820152601a60248201527f536166654d6174683a206469766973696f6e206279207a65726f000000000000604482015290519081900360640190fd5b81838161168757fe5b049392505050565b60006116e4826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166115b69092919063ffffffff16565b8051909150156115485780806020019051602081101561170357600080fd5b50516115485760405162461bcd60e51b815260040180806020018281038252602a8152602001806119b1602a913960400191505060405180910390fd5b6060824710156117815760405162461bcd60e51b81526004018080602001828103825260268152602001806119466026913960400191505060405180910390fd5b61178a8561189b565b6117db576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b600080866001600160a01b031685876040518082805190602001908083835b602083106118195780518252601f1990920191602091820191016117fa565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d806000811461187b576040519150601f19603f3d011682016040523d82523d6000602084013e611880565b606091505b50915091506118908282866118a1565b979650505050505050565b3b151590565b606083156118b05750816115c8565b8251156118c05782518084602001fd5b8160405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561190a5781810151838201526020016118f2565b50505050905090810190601f1680156119375780820380516001836020036101000a031916815260200191505b509250505060405180910390fdfe416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f774772616e7452656365697665723a206c6f772d6c6576656c2063616c6c206661696c65645361666545524332303a204552433230206f7065726174696f6e20646964206e6f74207375636365656454696d65706f696e742073686f756c6420626520696e20746865206675747572652ea264697066735822122085a8b7f393de1f8fb6d3621593b912f4516eb611745209cee2321b5d20062e9a64736f6c63430007060033";
