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
    _visionToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<DividendPool> {
    return super.deploy(
      _gov,
      _visionToken,
      overrides || {}
    ) as Promise<DividendPool>;
  }
  getDeployTransaction(
    _gov: string,
    _visionToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_gov, _visionToken, overrides || {});
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
        name: "_visionToken",
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
        name: "planter",
        type: "address",
      },
    ],
    name: "addPlanter",
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
        name: "farmer",
        type: "address",
      },
    ],
    name: "balanceOf",
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
    name: "batchDispatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
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
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
    ],
    name: "claimAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
    ],
    name: "dispatchFarmers",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "staker",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
    ],
    name: "dispatchableFarmers",
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
        name: "staker",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
    ],
    name: "dispatchedFarmers",
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
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "farms",
    outputs: [
      {
        internalType: "uint256",
        name: "totalFarmers",
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
    inputs: [
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "staker",
        type: "address",
      },
    ],
    name: "getAllClaimableCropsFor",
    outputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "farmer",
        type: "address",
      },
    ],
    name: "getAllClaimedCropsOf",
    outputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
    ],
    name: "getClaimableCrops",
    outputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "staker",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    name: "getClaimableCropsFor",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "farmer",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    name: "getClaimedCropsOf",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
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
        name: "jobBoard",
        type: "address",
      },
      {
        internalType: "address",
        name: "marketplace",
        type: "address",
      },
    ],
    name: "init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "epoch",
        type: "uint256",
      },
    ],
    name: "isClaimable",
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
        name: "epochs",
        type: "uint256",
      },
    ],
    name: "lock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "maximumLock",
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
    name: "minimumLock",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "plantSeeds",
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
    name: "planted",
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
        name: "",
        type: "uint256",
      },
    ],
    name: "plantedTokens",
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
        name: "staker",
        type: "address",
      },
    ],
    name: "remainingLocks",
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
        name: "planter",
        type: "address",
      },
    ],
    name: "removePlanter",
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
        name: "staker",
        type: "address",
      },
      {
        internalType: "address",
        name: "withdrawTo",
        type: "address",
      },
    ],
    name: "setWithdrawTo",
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
    name: "stake",
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
      {
        internalType: "uint256",
        name: "epochs",
        type: "uint256",
      },
    ],
    name: "stakeAndLock",
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
    name: "stakings",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "locked",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "withdrawTo",
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
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "visionToken",
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
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x610120604052600060018181556002919091556224ea0060c05260e0526032610100523480156200002f57600080fd5b50604051620029ed380380620029ed833981810160405260408110156200005557600080fd5b50805160209182015160008054336001600160a01b03199182168117909255600380549091169091179055606081901b6001600160601b0319166080524260a0529091620000ae908390620000b6811b62001b0617901c565b5050620001cc565b6000546001600160a01b0316331462000107576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b03811662000163576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b6200016e8162000171565b50565b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b60805160601c60a05160c05160e051610100516127c06200022d60003980611c9c5280611d495250806115d75280611cea525080611bbe5280611fef525080611ae45280611bdf525080610e2a5280611aa15280611fcb52506127c06000f3fe608060405234801561001057600080fd5b50600436106102e95760003560e01c8063873f8cb811610191578063b97dd9e2116100e3578063de19d07911610097578063f09a401611610071578063f09a401614610aad578063f2fd83e014610adb578063fd2dcecf14610ae3576102e9565b8063de19d07914610a80578063e7a0c94514610a9d578063efe97d0514610aa5576102e9565b8063d751dc78116100c8578063d751dc7814610a0e578063dc6e13e114610a16578063dd46706414610a63576102e9565b8063b97dd9e214610963578063bd5dec981461096b576102e9565b80639c724e2411610145578063a694fc3a1161011f578063a694fc3a14610918578063a7f0b3de14610935578063ab033ea91461093d576102e9565b80639c724e2414610831578063a10906ca14610839578063a120b20b14610865576102e9565b80638e3d1b66116101765780638e3d1b66146107bc578063948b6dd4146107e85780639be16ddb1461080b576102e9565b8063873f8cb81461075d57806389610a091461078b576102e9565b8063605cfbb51161024a57806371177b3c116101fe5780637da470ea116101d85780637da470ea1461070c5780637ec31c2a14610729578063853828b614610755576102e9565b806371177b3c146106c157806377a37ca5146106c95780637cae8e1a146106ef576102e9565b80636930fd2a1161022f5780636930fd2a146106615780636ee228f11461067e57806370a082311461069b576102e9565b8063605cfbb51461065157806366bfc15814610659576102e9565b806342eb9d94116102a157806348bb8bab1161028657806348bb8bab146105375780634ac6c090146105635780634e998bd11461059b576102e9565b806342eb9d9414610467578063438dd5b514610511576102e9565b80631c23e89f116102d25780631c23e89f1461031c5780632a7cc544146103425780632e17de781461044a576102e9565b806312d43a51146102ee5780631b343adc14610312575b600080fd5b6102f6610aeb565b604080516001600160a01b039092168252519081900360200190f35b61031a610afa565b005b61031a6004803603602081101561033257600080fd5b50356001600160a01b0316610b54565b6103fa6004803603606081101561035857600080fd5b8135916001600160a01b036020820135169181019060608101604082013564010000000081111561038857600080fd5b82018360208201111561039a57600080fd5b803590602001918460208302840111640100000000831117156103bc57600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550610c32945050505050565b60408051602080825283518183015283519192839290830191858101910280838360005b8381101561043657818101518382015260200161041e565b505050509050019250505060405180910390f35b61031a6004803603602081101561046057600080fd5b5035610d1f565b61031a6004803603604081101561047d57600080fd5b8135919081019060408101602082013564010000000081111561049f57600080fd5b8201836020820111156104b157600080fd5b803590602001918460208302840111640100000000831117156104d357600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550610e56945050505050565b61031a6004803603602081101561052757600080fd5b50356001600160a01b0316610fc0565b61031a6004803603604081101561054d57600080fd5b506001600160a01b03813516906020013561101c565b6105896004803603602081101561057957600080fd5b50356001600160a01b03166112f1565b60408051918252519081900360200190f35b6105b8600480360360208110156105b157600080fd5b5035611341565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156105fc5781810151838201526020016105e4565b50505050905001838103825284818151815260200191508051906020019060200280838360005b8381101561063b578181015183820152602001610623565b5050505090500194505050505060405180910390f35b61031a611469565b610589611514565b61031a6004803603602081101561067757600080fd5b503561151a565b6102f66004803603602081101561069457600080fd5b5035611592565b610589600480360360208110156106b157600080fd5b50356001600160a01b03166115bc565b6105896115d5565b6105b8600480360360208110156106df57600080fd5b50356001600160a01b03166115f9565b61031a6004803603602081101561070557600080fd5b503561166a565b6105896004803603602081101561072257600080fd5b5035611746565b6105896004803603604081101561073f57600080fd5b506001600160a01b038135169060200135611758565b61031a611783565b61031a6004803603604081101561077357600080fd5b506001600160a01b03813581169160200135166117e6565b6107a8600480360360208110156107a157600080fd5b5035611894565b604080519115158252519081900360200190f35b610589600480360360408110156107d257600080fd5b506001600160a01b0381351690602001356118a7565b61031a600480360360408110156107fe57600080fd5b50803590602001356118f7565b6107a86004803603602081101561082157600080fd5b50356001600160a01b031661190d565b610589611922565b6105b86004803603604081101561084f57600080fd5b50803590602001356001600160a01b0316611928565b6103fa6004803603604081101561087b57600080fd5b6001600160a01b0382351691908101906040810160208201356401000000008111156108a657600080fd5b8201836020820111156108b857600080fd5b803590602001918460208302840111640100000000831117156108da57600080fd5b9190808060200260200160405190810160405280939291908181526020018383602002808284376000920191909152509295506119b0945050505050565b61031a6004803603602081101561092e57600080fd5b5035611a8b565b610589611ae2565b61031a6004803603602081101561095357600080fd5b50356001600160a01b0316611b06565b610589611bba565b61031a6004803603602081101561098157600080fd5b81019060208101813564010000000081111561099c57600080fd5b8201836020820111156109ae57600080fd5b803590602001918460208302840111640100000000831117156109d057600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550611c0d945050505050565b610589611c9a565b610a3c60048036036020811015610a2c57600080fd5b50356001600160a01b0316611cbe565b6040805193845260208401929092526001600160a01b031682820152519081900360600190f35b61031a60048036036020811015610a7957600080fd5b5035611ce8565b61031a60048036036020811015610a9657600080fd5b5035611e0f565b61031a611ef8565b610589611f32565b61031a60048036036040811015610ac357600080fd5b506001600160a01b0381358116916020013516611f44565b6102f6611fc9565b610589611fed565b6000546001600160a01b031681565b6000546001600160a01b03163314610b4a576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b610b52612011565b565b6000546001600160a01b03163314610ba4576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b03811660009081526004602052604090205460ff16610c11576040805162461bcd60e51b815260206004820152601860248201527f4e6f742061207265676973746572656420706c616e7465720000000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600460205260409020805460ff19169055565b600083815260086020526040902081516060919067ffffffffffffffff81118015610c5c57600080fd5b50604051908082528060200260200182016040528015610c86578160200160208202803683370190505b50915060005b8351811015610d16576000848281518110610ca357fe5b60209081029190910181015184546001600160a01b03808a1660009081526003880185526040808220549285168252600289019095529390932054919350610cf6929091610cf09161204a565b906120aa565b848381518110610d0257fe5b602090810291909101015250600101610c8c565b50509392505050565b336000908152600960205260409020610d36611bba565b816001015410610d8d576040805162461bcd60e51b815260206004820152601160248201527f5374616b696e67206973206c6f636b6564000000000000000000000000000000604482015290519081900360640190fd5b8054821115610de3576040805162461bcd60e51b815260206004820152601260248201527f4e6f7420656e6f7567682062616c616e63650000000000000000000000000000604482015290519081900360640190fd5b8054610def9083612111565b815560028101546000906001600160a01b0316610e0c5733610e1b565b60028201546001600160a01b03165b9050610e516001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016828561216e565b505050565b610e5f82611894565b610eb0576040805162461bcd60e51b815260206004820152600a60248201527f556e726970652079657400000000000000000000000000000000000000000000604482015290519081900360640190fd5b600082815260086020526040812090610eca843385610c32565b905060005b8351811015610f88576000848281518110610ee657fe5b602002602001015190506000838381518110610efe57fe5b60200260200101519050610f4281866002016000856001600160a01b03166001600160a01b031681526020019081526020016000205461211190919063ffffffff16565b6001600160a01b03909216600081815260028701602090815260408083209590955533825260058152848220928252919091529190912080549091019055600101610ecf565b503360009081526003830160205260409020548254610fa691612111565b825550336000908152600390910160205260408120555050565b6000546001600160a01b03163314611010576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b611019816121ee565b50565b3360009081526004602052604090205460ff16611080576040805162461bcd60e51b815260206004820152601860248201527f4e6f742061207265676973746572656420706c616e7465720000000000000000604482015290519081900360640190fd5b806110d2576040805162461bcd60e51b815260206004820152600960248201527f4e6f20616d6f756e740000000000000000000000000000000000000000000000604482015290519081900360640190fd5b80826001600160a01b03166370a08231336040518263ffffffff1660e01b815260040180826001600160a01b0316815260200191505060206040518083038186803b15801561112057600080fd5b505afa158015611134573d6000803e3d6000fd5b505050506040513d602081101561114a57600080fd5b5051101561119f576040805162461bcd60e51b815260206004820152601960248201527f4e6f7420656e6f75676820746f6b656e2062616c616e63652e00000000000000604482015290519081900360640190fd5b6001600160a01b03821660009081526006602052604090205460ff16611225576001600160a01b0382166000818152600660205260408120805460ff191660019081179091556007805491820181559091527fa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c6880180546001600160a01b03191690911790555b600060086000611233611f32565b8152602080820192909252604090810160009081206001600160a01b0387168252600281019093522054909150611294576001818101805491820181556000908152602090200180546001600160a01b0319166001600160a01b0385161790555b6112a96001600160a01b038416333085612280565b6001600160a01b03831660009081526002820160205260409020546112ce908361230e565b6001600160a01b0390931660009081526002909101602052604090209190915550565b6000806112fc611bba565b6001600160a01b038416600090815260096020526040812060018101549293509183111561132c57506000611339565b8282600101546001010390505b949350505050565b6000818152600860209081526040918290206001810180548451818502810185019095528085526060948594909291908301828280156113aa57602002820191906000526020600020905b81546001600160a01b0316815260019091019060200180831161138c575b50505050509250825167ffffffffffffffff811180156113c957600080fd5b506040519080825280602002602001820160405280156113f3578160200160208202803683370190505b50915060005b835181101561146257600084828151811061141057fe5b60200260200101519050826002016000826001600160a01b03166001600160a01b031681526020019081526020016000205484838151811061144e57fe5b6020908102919091010152506001016113f9565b5050915091565b6002546114bd576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b600254421015610b4a576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b60015481565b611019816008600084815260200190815260200160002060010180548060200260200160405190810160405280929190818152602001828054801561158857602002820191906000526020600020905b81546001600160a01b0316815260019091019060200180831161156a575b5050505050610e56565b600781815481106115a257600080fd5b6000918252602090912001546001600160a01b0316905081565b60006115cf826115ca611bba565b6118a7565b92915050565b7f000000000000000000000000000000000000000000000000000000000000000081565b606080600780548060200260200160405190810160405280929190818152602001828054801561165257602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311611634575b5050505050915061166383836119b0565b9050915091565b611672611bba565b81116116af5760405162461bcd60e51b81526004018080602001828103825260238152602001806126bb6023913960400191505060405180910390fd5b60006116bb33836118a7565b905060006116c93384611758565b90508082101561170a5760405162461bcd60e51b815260040180806020018281038252602a8152602001806126de602a913960400191505060405180910390fd5b600083815260086020526040902080548284039190611729908361230e565b815533600090815260039091016020526040902092909255505050565b60086020526000908152604090205481565b60009081526008602090815260408083206001600160a01b0394909416835260039093019052205490565b610b5260078054806020026020016040519081016040528092919081815260200182805480156117dc57602002820191906000526020600020905b81546001600160a01b031681526001909101906020018083116117be575b5050505050611c0d565b33600090815260096020526040812060028101549091906001600160a01b0316611810578361181f565b60028201546001600160a01b03165b90506001600160a01b038116331461186f576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b5060020180546001600160a01b0319166001600160a01b039290921691909117905550565b600061189e611bba565b90911115919050565b6001600160a01b0382166000908152600960205260408120600181015482908411156118d5575060006118e2565b8382600101546001010390505b81546118ee908261204a565b95945050505050565b61190082611a8b565b61190981611ce8565b5050565b60066020526000908152604090205460ff1681565b60025481565b6060806008600085815260200190815260200160002060010180548060200260200160405190810160405280929190818152602001828054801561199557602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311611977575b505050505091506119a7848484610c32565b90509250929050565b6060815167ffffffffffffffff811180156119ca57600080fd5b506040519080825280602002602001820160405280156119f4578160200160208202803683370190505b50905060005b8251811015611a84576000838281518110611a1157fe5b6020026020010151905060056000866001600160a01b03166001600160a01b031681526020019081526020016000206000826001600160a01b03166001600160a01b0316815260200190815260200160002054838381518110611a7057fe5b6020908102919091010152506001016119fa565b5092915050565b33600081815260096020526040902090611ad1907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316903085612280565b8054611add908361230e565b905550565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000546001600160a01b03163314611b56576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b038116611bb1576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b61101981612368565b60007f00000000000000000000000000000000000000000000000000000000000000007f0000000000000000000000000000000000000000000000000000000000000000420381611c0757fe5b04905090565b60005b8151811015611909576000828281518110611c2757fe5b6020908102919091018101513360009081526005835260408082206001600160a01b038416835290935291909120549091508015611c90573360008181526005602090815260408083206001600160a01b0387168085529252822091909155611c90918361216e565b5050600101611c10565b7f000000000000000000000000000000000000000000000000000000000000000081565b6009602052600090815260409020805460018201546002909201549091906001600160a01b031683565b7f0000000000000000000000000000000000000000000000000000000000000000811015611d475760405162461bcd60e51b81526004018080602001828103825260378152602001806127086037913960400191505060405180910390fd5b7f0000000000000000000000000000000000000000000000000000000000000000811115611da65760405162461bcd60e51b81526004018080602001828103825260348152602001806126666034913960400191505060405180910390fd5b600081611db1611bba565b33600090815260096020526040902060018101549190920192508211611e085760405162461bcd60e51b81526004018080602001828103825260228152602001806126446022913960400191505060405180910390fd5b6001015550565b6000546001600160a01b03163314611e5f576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b60025415611eb4576040805162461bcd60e51b815260206004820152600e60248201527f43616e6e6f74207570646174652e000000000000000000000000000000000000604482015290519081900360640190fd5b42811015611ef35760405162461bcd60e51b81526004018080602001828103825260228152602001806127696022913960400191505060405180910390fd5b600255565b6000611f03336112f1565b90506000611f0f611bba565b905060005b82811015610e5157611f2a81836001010161166a565b600101611f14565b6000611f3c611bba565b600101905090565b6003546001600160a01b03163314611fa3576040805162461bcd60e51b815260206004820181905260248201527f4f6e6c7920616c6c6f77656420746f2074686520696e6974696c61697a65722e604482015290519081900360640190fd5b611fac826121ee565b611fb5816121ee565b5050600380546001600160a01b0319169055565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b61201b6000612368565b426001556040517fbf30e910dd2b6e24c75c800d9f3477674e89a4b45e366f87cd03c99e0ba6496190600090a1565b600082612059575060006115cf565b8282028284828161206657fe5b04146120a35760405162461bcd60e51b815260040180806020018281038252602181526020018061269a6021913960400191505060405180910390fd5b9392505050565b6000808211612100576040805162461bcd60e51b815260206004820152601a60248201527f536166654d6174683a206469766973696f6e206279207a65726f000000000000604482015290519081900360640190fd5b81838161210957fe5b049392505050565b600082821115612168576040805162461bcd60e51b815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b50900390565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb00000000000000000000000000000000000000000000000000000000179052610e519084906123c3565b6001600160a01b03811660009081526004602052604090205460ff161561225c576040805162461bcd60e51b815260206004820152601260248201527f416c726561647920726567697374657265640000000000000000000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600460205260409020805460ff19166001179055565b604080516001600160a01b0380861660248301528416604482015260648082018490528251808303909101815260849091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f23b872dd000000000000000000000000000000000000000000000000000000001790526123089085906123c3565b50505050565b6000828201838110156120a3576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b6000612418826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166124749092919063ffffffff16565b805190915015610e515780806020019051602081101561243757600080fd5b5051610e515760405162461bcd60e51b815260040180806020018281038252602a81526020018061273f602a913960400191505060405180910390fd5b606061133984846000858561248885612599565b6124d9576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b600080866001600160a01b031685876040518082805190602001908083835b602083106125175780518252601f1990920191602091820191016124f8565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d8060008114612579576040519150601f19603f3d011682016040523d82523d6000602084013e61257e565b606091505b509150915061258e82828661259f565b979650505050505050565b3b151590565b606083156125ae5750816120a3565b8251156125be5782518084602001fd5b8160405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156126085781810151838201526020016125f0565b50505050905090810190601f1680156126355780820380516001836020036101000a031916815260200191505b509250505060405180910390fdfe4974206f6e6c7920616c6c6f777320657874656e64696e6720746865206c6f636b2e53686f756c64206265206c657373206f7220657175616c207468616e20746865206d6178696d756d206c6f636b20706572696f64536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7743616e6e6f74206469737061746368206661726d65727320746f20746865207061737443616e6e6f7420776974686472617720616c72656164792064697370617463686564206661726d65727353686f756c642062652067726561746572206f7220657175616c207468616e20746865206d696e696d756d206c6f636b20706572696f645361666545524332303a204552433230206f7065726174696f6e20646964206e6f74207375636365656454696d65706f696e742073686f756c6420626520696e20746865206675747572652ea2646970667358221220047a1fc2793e17008e22949ee43818e84870aec1cde1341574d11b172011d84864736f6c63430007060033";
