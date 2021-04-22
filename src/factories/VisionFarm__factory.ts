/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { VisionFarm } from "../VisionFarm";

export class VisionFarm__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _gov: string,
    _visionToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<VisionFarm> {
    return super.deploy(
      _gov,
      _visionToken,
      overrides || {}
    ) as Promise<VisionFarm>;
  }
  getDeployTransaction(
    _gov: string,
    _visionToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_gov, _visionToken, overrides || {});
  }
  attach(address: string): VisionFarm {
    return super.attach(address) as VisionFarm;
  }
  connect(signer: Signer): VisionFarm__factory {
    return super.connect(signer) as VisionFarm__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VisionFarm {
    return new Contract(address, _abi, signerOrProvider) as VisionFarm;
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
    name: "getAllHarvestableCropsFor",
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
    name: "getAllHarvestedCropsOf",
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
        name: "epoch",
        type: "uint256",
      },
    ],
    name: "getHarvestableCrops",
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
    name: "getHarvestableCropsFor",
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
    name: "getHarvestedCropsOf",
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
    name: "harvest",
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
    name: "harvestAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "cryptoJobBoard",
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
    name: "isHarvestable",
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
  "0x610120604052600060018181556002919091556224ea0060c05260e0526032610100523480156200002f57600080fd5b50604051620028ef380380620028ef833981810160405260408110156200005557600080fd5b50805160209182015160008054336001600160a01b03199182168117909255600380549091169091179055606081901b6001600160601b0319166080524260a0529091620000ae908390620000b6811b6200173217901c565b5050620001cc565b6000546001600160a01b0316331462000107576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b03811662000163576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b6200016e8162000171565b50565b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b60805160601c60a05160c05160e051610100516126c26200022d60003980611a2d5280611ba45250806114185280611b455250806118d75280611ee452508061171052806118f8525080610cca52806116cd5280611ec052506126c26000f3fe608060405234801561001057600080fd5b50600436106102de5760003560e01c80639be16ddb11610186578063d751dc78116100e3578063e6836d6a11610097578063f09a401611610071578063f09a401614610a66578063f2fd83e014610a94578063fd2dcecf14610a9c576102de565b8063e6836d6a14610a2a578063e7a0c94514610a56578063efe97d0514610a5e576102de565b8063dc6e13e1116100c8578063dc6e13e1146109b1578063dd467064146109f0578063de19d07914610a0d576102de565b8063d751dc78146108f6578063db7fb382146108fe576102de565b8063ab033ea91161013a578063b97dd9e21161011f578063b97dd9e21461082e578063bd5dec9814610836578063d6595f3a146108d9576102de565b8063ab033ea914610700578063afa173de14610726576102de565b80639c724e241161016b5780639c724e24146106d3578063a694fc3a146106db578063a7f0b3de146106f8576102de565b80639be16ddb1461067c5780639c0981f3146106b6576102de565b8063690141371161023f5780637da470ea116101f35780638e3d1b66116101cd5780638e3d1b66146106075780639056f91814610633578063948b6dd414610659576102de565b80637da470ea146105b65780637ec31c2a146105d3578063853828b6146105ff576102de565b806370a082311161022457806370a082311461056b57806371177b3c146105915780637cae8e1a14610599576102de565b806369014137146104985780636ee228f11461054e576102de565b8063438dd5b5116102965780634ac6c0901161027b5780634ac6c09014610450578063605cfbb51461048857806366bfc15814610490576102de565b8063438dd5b5146103fe57806348bb8bab14610424576102de565b80631c23e89f116102c75780631c23e89f146103115780632e17de78146103375780633b17d5a114610354576102de565b806312d43a51146102e35780631b343adc14610307575b600080fd5b6102eb610aa4565b604080516001600160a01b039092168252519081900360200190f35b61030f610ab3565b005b61030f6004803603602081101561032757600080fd5b50356001600160a01b0316610b0d565b61030f6004803603602081101561034d57600080fd5b5035610beb565b61030f6004803603604081101561036a57600080fd5b8135919081019060408101602082013564010000000081111561038c57600080fd5b82018360208201111561039e57600080fd5b803590602001918460208302840111640100000000831117156103c057600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550610cf5945050505050565b61030f6004803603602081101561041457600080fd5b50356001600160a01b0316610e5f565b61030f6004803603604081101561043a57600080fd5b506001600160a01b038135169060200135610ebb565b6104766004803603602081101561046657600080fd5b50356001600160a01b03166111aa565b60408051918252519081900360200190f35b61030f6111fa565b6104766112a5565b6104b5600480360360208110156104ae57600080fd5b50356112ab565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156104f95781810151838201526020016104e1565b50505050905001838103825284818151815260200191508051906020019060200280838360005b83811015610538578181015183820152602001610520565b5050505090500194505050505060405180910390f35b6102eb6004803603602081101561056457600080fd5b50356113d3565b6104766004803603602081101561058157600080fd5b50356001600160a01b03166113fd565b610476611416565b61030f600480360360208110156105af57600080fd5b503561143a565b610476600480360360208110156105cc57600080fd5b5035611516565b610476600480360360408110156105e957600080fd5b506001600160a01b038135169060200135611528565b61030f611553565b6104766004803603604081101561061d57600080fd5b506001600160a01b0381351690602001356115b6565b6104b56004803603602081101561064957600080fd5b50356001600160a01b0316611606565b61030f6004803603604081101561066f57600080fd5b5080359060200135611677565b6106a26004803603602081101561069257600080fd5b50356001600160a01b0316611689565b604080519115158252519081900360200190f35b6106a2600480360360208110156106cc57600080fd5b503561169e565b6104766116b1565b61030f600480360360208110156106f157600080fd5b50356116b7565b61047661170e565b61030f6004803603602081101561071657600080fd5b50356001600160a01b0316611732565b6107de6004803603606081101561073c57600080fd5b8135916001600160a01b036020820135169181019060608101604082013564010000000081111561076c57600080fd5b82018360208201111561077e57600080fd5b803590602001918460208302840111640100000000831117156107a057600080fd5b9190808060200260200160405190810160405280939291908181526020018383602002808284376000920191909152509295506117e6945050505050565b60408051602080825283518183015283519192839290830191858101910280838360005b8381101561081a578181015183820152602001610802565b505050509050019250505060405180910390f35b6104766118d3565b61030f6004803603602081101561084c57600080fd5b81019060208101813564010000000081111561086757600080fd5b82018360208201111561087957600080fd5b8035906020019184602083028401116401000000008311171561089b57600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550611926945050505050565b61030f600480360360208110156108ef57600080fd5b50356119b3565b610476611a2b565b6107de6004803603604081101561091457600080fd5b6001600160a01b03823516919081019060408101602082013564010000000081111561093f57600080fd5b82018360208201111561095157600080fd5b8035906020019184602083028401116401000000008311171561097357600080fd5b919080806020026020016040519081016040528093929190818152602001838360200280828437600092019190915250929550611a4f945050505050565b6109d7600480360360208110156109c757600080fd5b50356001600160a01b0316611b2a565b6040805192835260208301919091528051918290030190f35b61030f60048036036020811015610a0657600080fd5b5035611b43565b61030f60048036036020811015610a2357600080fd5b5035611c6a565b6104b560048036036040811015610a4057600080fd5b50803590602001356001600160a01b0316611d53565b61030f611ddb565b610476611e1a565b61030f60048036036040811015610a7c57600080fd5b506001600160a01b0381358116916020013516611e2c565b6102eb611ebe565b610476611ee2565b6000546001600160a01b031681565b6000546001600160a01b03163314610b03576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b610b0b611f06565b565b6000546001600160a01b03163314610b5d576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b03811660009081526004602052604090205460ff16610bca576040805162461bcd60e51b815260206004820152601860248201527f4e6f742061207265676973746572656420706c616e7465720000000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600460205260409020805460ff19169055565b336000908152600960205260409020610c026118d3565b816001015410610c59576040805162461bcd60e51b815260206004820152601160248201527f5374616b696e67206973206c6f636b6564000000000000000000000000000000604482015290519081900360640190fd5b8054821115610caf576040805162461bcd60e51b815260206004820152601260248201527f4e6f7420656e6f7567682062616c616e63650000000000000000000000000000604482015290519081900360640190fd5b8054610cbb9083611f3f565b8155610cf16001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000163384611f9c565b5050565b610cfe8261169e565b610d4f576040805162461bcd60e51b815260206004820152600a60248201527f556e726970652079657400000000000000000000000000000000000000000000604482015290519081900360640190fd5b600082815260086020526040812090610d698433856117e6565b905060005b8351811015610e27576000848281518110610d8557fe5b602002602001015190506000838381518110610d9d57fe5b60200260200101519050610de181866002016000856001600160a01b03166001600160a01b0316815260200190815260200160002054611f3f90919063ffffffff16565b6001600160a01b03909216600081815260028701602090815260408083209590955533825260058152848220928252919091529190912080549091019055600101610d6e565b503360009081526003830160205260409020548254610e4591611f3f565b825550336000908152600390910160205260408120555050565b6000546001600160a01b03163314610eaf576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b610eb88161201c565b50565b3360009081526004602052604090205460ff16610f1f576040805162461bcd60e51b815260206004820152601860248201527f4e6f742061207265676973746572656420706c616e7465720000000000000000604482015290519081900360640190fd5b80610f71576040805162461bcd60e51b815260206004820152600960248201527f4e6f20616d6f756e740000000000000000000000000000000000000000000000604482015290519081900360640190fd5b80826001600160a01b03166370a08231336040518263ffffffff1660e01b815260040180826001600160a01b0316815260200191505060206040518083038186803b158015610fbf57600080fd5b505afa158015610fd3573d6000803e3d6000fd5b505050506040513d6020811015610fe957600080fd5b5051101561103e576040805162461bcd60e51b815260206004820152601960248201527f4e6f7420656e6f75676820746f6b656e2062616c616e63652e00000000000000604482015290519081900360640190fd5b6001600160a01b03821660009081526006602052604090205460ff166110d1576001600160a01b0382166000818152600660205260408120805460ff191660019081179091556007805491820181559091527fa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c68801805473ffffffffffffffffffffffffffffffffffffffff191690911790555b6000600860006110df611e1a565b8152602080820192909252604090810160009081206001600160a01b038716825260028101909352205490915061114d5760018181018054918201815560009081526020902001805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0385161790555b6111626001600160a01b0384163330856120ae565b6001600160a01b0383166000908152600282016020526040902054611187908361213c565b6001600160a01b0390931660009081526002909101602052604090209190915550565b6000806111b56118d3565b6001600160a01b03841660009081526009602052604081206001810154929350918311156111e5575060006111f2565b8282600101546001010390505b949350505050565b60025461124e576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b600254421015610b03576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b60015481565b60008181526008602090815260409182902060018101805484518185028101850190955280855260609485949092919083018282801561131457602002820191906000526020600020905b81546001600160a01b031681526001909101906020018083116112f6575b50505050509250825167ffffffffffffffff8111801561133357600080fd5b5060405190808252806020026020018201604052801561135d578160200160208202803683370190505b50915060005b83518110156113cc57600084828151811061137a57fe5b60200260200101519050826002016000826001600160a01b03166001600160a01b03168152602001908152602001600020548483815181106113b857fe5b602090810291909101015250600101611363565b5050915091565b600781815481106113e357600080fd5b6000918252602090912001546001600160a01b0316905081565b60006114108261140b6118d3565b6115b6565b92915050565b7f000000000000000000000000000000000000000000000000000000000000000081565b6114426118d3565b811161147f5760405162461bcd60e51b81526004018080602001828103825260238152602001806125bd6023913960400191505060405180910390fd5b600061148b33836115b6565b905060006114993384611528565b9050808210156114da5760405162461bcd60e51b815260040180806020018281038252602a8152602001806125e0602a913960400191505060405180910390fd5b6000838152600860205260409020805482840391906114f9908361213c565b815533600090815260039091016020526040902092909255505050565b60086020526000908152604090205481565b60009081526008602090815260408083206001600160a01b0394909416835260039093019052205490565b610b0b60078054806020026020016040519081016040528092919081815260200182805480156115ac57602002820191906000526020600020905b81546001600160a01b0316815260019091019060200180831161158e575b5050505050611926565b6001600160a01b0382166000908152600960205260408120600181015482908411156115e4575060006115f1565b8382600101546001010390505b81546115fd908261219d565b95945050505050565b606080600780548060200260200160405190810160405280929190818152602001828054801561165f57602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311611641575b505050505091506116708383611a4f565b9050915091565b611680826116b7565b610cf181611b43565b60066020526000908152604090205460ff1681565b60006116a86118d3565b90911115919050565b60025481565b336000818152600960205260409020906116fd907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169030856120ae565b8054611709908361213c565b905550565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000546001600160a01b03163314611782576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b0381166117dd576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b610eb8816121f6565b600083815260086020526040902081516060919067ffffffffffffffff8111801561181057600080fd5b5060405190808252806020026020018201604052801561183a578160200160208202803683370190505b50915060005b83518110156118ca57600084828151811061185757fe5b60209081029190910181015184546001600160a01b03808a16600090815260038801855260408082205492851682526002890190955293909320549193506118aa9290916118a49161219d565b9061225e565b8483815181106118b657fe5b602090810291909101015250600101611840565b50509392505050565b60007f00000000000000000000000000000000000000000000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000042038161192057fe5b04905090565b60005b8151811015610cf157600082828151811061194057fe5b6020908102919091018101513360009081526005835260408082206001600160a01b0384168352909352919091205490915080156119a9573360008181526005602090815260408083206001600160a01b03871680855292528220919091556119a99183611f9c565b5050600101611929565b610eb88160086000848152602001908152602001600020600101805480602002602001604051908101604052809291908181526020018280548015611a2157602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311611a03575b5050505050610cf5565b7f000000000000000000000000000000000000000000000000000000000000000081565b6060815167ffffffffffffffff81118015611a6957600080fd5b50604051908082528060200260200182016040528015611a93578160200160208202803683370190505b50905060005b8251811015611b23576000838281518110611ab057fe5b6020026020010151905060056000866001600160a01b03166001600160a01b031681526020019081526020016000206000826001600160a01b03166001600160a01b0316815260200190815260200160002054838381518110611b0f57fe5b602090810291909101015250600101611a99565b5092915050565b6009602052600090815260409020805460019091015482565b7f0000000000000000000000000000000000000000000000000000000000000000811015611ba25760405162461bcd60e51b815260040180806020018281038252603781526020018061260a6037913960400191505060405180910390fd5b7f0000000000000000000000000000000000000000000000000000000000000000811115611c015760405162461bcd60e51b81526004018080602001828103825260348152602001806125686034913960400191505060405180910390fd5b600081611c0c6118d3565b33600090815260096020526040902060018101549190920192508211611c635760405162461bcd60e51b81526004018080602001828103825260228152602001806125466022913960400191505060405180910390fd5b6001015550565b6000546001600160a01b03163314611cba576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b60025415611d0f576040805162461bcd60e51b815260206004820152600e60248201527f43616e6e6f74207570646174652e000000000000000000000000000000000000604482015290519081900360640190fd5b42811015611d4e5760405162461bcd60e51b815260040180806020018281038252602281526020018061266b6022913960400191505060405180910390fd5b600255565b60608060086000858152602001908152602001600020600101805480602002602001604051908101604052809291908181526020018280548015611dc057602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311611da2575b50505050509150611dd28484846117e6565b90509250929050565b6000611de6336111aa565b90506000611df26118d3565b905060005b82811015611e1557611e0d81836001010161143a565b600101611df7565b505050565b6000611e246118d3565b600101905090565b6003546001600160a01b03163314611e8b576040805162461bcd60e51b815260206004820181905260248201527f4f6e6c7920616c6c6f77656420746f2074686520696e6974696c61697a65722e604482015290519081900360640190fd5b611e948261201c565b611e9d8161201c565b50506003805473ffffffffffffffffffffffffffffffffffffffff19169055565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b611f1060006121f6565b426001556040517fbf30e910dd2b6e24c75c800d9f3477674e89a4b45e366f87cd03c99e0ba6496190600090a1565b600082821115611f96576040805162461bcd60e51b815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b50900390565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb00000000000000000000000000000000000000000000000000000000179052611e159084906122c5565b6001600160a01b03811660009081526004602052604090205460ff161561208a576040805162461bcd60e51b815260206004820152601260248201527f416c726561647920726567697374657265640000000000000000000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600460205260409020805460ff19166001179055565b604080516001600160a01b0380861660248301528416604482015260648082018490528251808303909101815260849091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f23b872dd000000000000000000000000000000000000000000000000000000001790526121369085906122c5565b50505050565b600082820183811015612196576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b6000826121ac57506000611410565b828202828482816121b957fe5b04146121965760405162461bcd60e51b815260040180806020018281038252602181526020018061259c6021913960400191505060405180910390fd5b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a36000805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b60008082116122b4576040805162461bcd60e51b815260206004820152601a60248201527f536166654d6174683a206469766973696f6e206279207a65726f000000000000604482015290519081900360640190fd5b8183816122bd57fe5b049392505050565b600061231a826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166123769092919063ffffffff16565b805190915015611e155780806020019051602081101561233957600080fd5b5051611e155760405162461bcd60e51b815260040180806020018281038252602a815260200180612641602a913960400191505060405180910390fd5b60606111f284846000858561238a8561249b565b6123db576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b600080866001600160a01b031685876040518082805190602001908083835b602083106124195780518252601f1990920191602091820191016123fa565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d806000811461247b576040519150601f19603f3d011682016040523d82523d6000602084013e612480565b606091505b50915091506124908282866124a1565b979650505050505050565b3b151590565b606083156124b0575081612196565b8251156124c05782518084602001fd5b8160405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561250a5781810151838201526020016124f2565b50505050905090810190601f1680156125375780820380516001836020036101000a031916815260200191505b509250505060405180910390fdfe4974206f6e6c7920616c6c6f777320657874656e64696e6720746865206c6f636b2e53686f756c64206265206c657373206f7220657175616c207468616e20746865206d6178696d756d206c6f636b20706572696f64536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7743616e6e6f74206469737061746368206661726d65727320746f20746865207061737443616e6e6f7420776974686472617720616c72656164792064697370617463686564206661726d65727353686f756c642062652067726561746572206f7220657175616c207468616e20746865206d696e696d756d206c6f636b20706572696f645361666545524332303a204552433230206f7065726174696f6e20646964206e6f74207375636365656454696d65706f696e742073686f756c6420626520696e20746865206675747572652ea264697066735822122076e1dc48cc9f00fa442f45e95ee6ce669bb4a93a5cacb2fe29ebb20fdc6187a664736f6c63430007060033";
