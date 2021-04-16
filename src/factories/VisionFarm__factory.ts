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
    ],
    name: "getHarvestableCropsFor",
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
    ],
    name: "harvest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "harvestAndDispatchToNewFarm",
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
];

const _bytecode =
  "0x610120604052600060018181556002919091556224ea0060c05260e0526032610100523480156200002f57600080fd5b5060405162001f3f38038062001f3f833981810160405260408110156200005557600080fd5b50805160209182015160008054336001600160a01b03199182168117909255600380549091169091179055606081901b6001600160601b0319166080524260a0529091620000ae908390620000b6811b6200127617901c565b5050620001cc565b6000546001600160a01b0316331462000107576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b03811662000163576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b6200016e8162000171565b50565b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b60805160601c60a05160c05160e05161010051611d126200022d6000398061137f528061141b525080610fd052806113bc52508061132e5280611895525080611254528061134f525080610a0552806111c552806118715250611d126000f3fe608060405234801561001057600080fd5b50600436106102265760003560e01c8063948b6dd41161012a578063dc6e13e1116100bd578063e7a0c9451161008c578063f09a401611610071578063f09a401614610617578063f2fd83e014610645578063fd2dcecf1461064d57610226565b8063e7a0c94514610607578063efe97d051461060f57610226565b8063dc6e13e114610571578063dd467064146105b0578063ddc63262146105cd578063de19d079146105ea57610226565b8063a7f0b3de116100f9578063a7f0b3de14610533578063ab033ea91461053b578063b97dd9e214610561578063d751dc781461056957610226565b8063948b6dd4146104ba5780639c0981f3146104dd5780639c724e241461050e578063a694fc3a1461051657610226565b80634ac6c090116101bd57806371177b3c1161018c5780637da470ea116101715780637da470ea146104455780637ec31c2a146104625780638e3d1b661461048e57610226565b806371177b3c146104205780637cae8e1a1461042857610226565b80634ac6c090146103bb578063605cfbb5146103f357806366bfc158146103fb578063690141371461040357610226565b80631c23e89f116101f95780631c23e89f146103265780632e17de781461034c578063438dd5b51461036957806348bb8bab1461038f57610226565b806311c1a24b1461022b57806312d43a511461023557806317d594f4146102595780631b343adc1461031e575b600080fd5b610233610655565b005b61023d610679565b604080516001600160a01b039092168252519081900360200190f35b6102856004803603604081101561026f57600080fd5b50803590602001356001600160a01b0316610688565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156102c95781810151838201526020016102b1565b50505050905001838103825284818151815260200191508051906020019060200280838360005b838110156103085781810151838201526020016102f0565b5050505090500194505050505060405180910390f35b6102336107d4565b6102336004803603602081101561033c57600080fd5b50356001600160a01b031661082e565b6102336004803603602081101561036257600080fd5b503561090c565b6102336004803603602081101561037f57600080fd5b50356001600160a01b0316610a7d565b610233600480360360408110156103a557600080fd5b506001600160a01b038135169060200135610ad6565b6103e1600480360360208110156103d157600080fd5b50356001600160a01b0316610da5565b60408051918252519081900360200190f35b610233610df5565b6103e1610ea0565b6102856004803603602081101561041957600080fd5b5035610ea6565b6103e1610fce565b6102336004803603602081101561043e57600080fd5b5035610ff2565b6103e16004803603602081101561045b57600080fd5b50356110ce565b6103e16004803603604081101561047857600080fd5b506001600160a01b0381351690602001356110e0565b6103e1600480360360408110156104a457600080fd5b506001600160a01b03813516906020013561110d565b610233600480360360408110156104d057600080fd5b508035906020013561115d565b6104fa600480360360208110156104f357600080fd5b5035611173565b604080519115158252519081900360200190f35b6103e1611186565b6102336004803603602081101561052c57600080fd5b503561118c565b6103e1611252565b6102336004803603602081101561055157600080fd5b50356001600160a01b0316611276565b6103e161132a565b6103e161137d565b6105976004803603602081101561058757600080fd5b50356001600160a01b03166113a1565b6040805192835260208301919091528051918290030190f35b610233600480360360208110156105c657600080fd5b50356113ba565b610233600480360360208110156105e357600080fd5b50356114e1565b6102336004803603602081101561060057600080fd5b50356116a3565b61023361178c565b6103e16117cb565b6102336004803603604081101561062d57600080fd5b506001600160a01b03813581169160200135166117dd565b61023d61186f565b6103e1611893565b600061065f61132a565b905061066a816114e1565b61067681600101610ff2565b50565b6000546001600160a01b031681565b6000828152600560209081526040918290206001810180548451818502810185019095528085526060948594909291908301828280156106f157602002820191906000526020600020905b81546001600160a01b031681526001909101906020018083116106d3575b50505050509250825167ffffffffffffffff8111801561071057600080fd5b5060405190808252806020026020018201604052801561073a578160200160208202803683370190505b50915060005b83518110156107ca57600084828151811061075757fe5b60209081029190910181015184546001600160a01b03808a16600090815260038801855260408082205492851682526002890190955293909320549193506107aa9290916107a4916118b7565b90611917565b8483815181106107b657fe5b602090810291909101015250600101610740565b50505b9250929050565b6000546001600160a01b03163314610824576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b61082c61197e565b565b6000546001600160a01b0316331461087e576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b03811660009081526004602052604090205460ff166108eb576040805162461bcd60e51b815260206004820152601860248201527f4e6f742061207265676973746572656420706c616e7465720000000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600460205260409020805460ff19169055565b33600090815260066020526040902061092361132a565b81600101541061097a576040805162461bcd60e51b815260206004820152601160248201527f5374616b696e67206973206c6f636b6564000000000000000000000000000000604482015290519081900360640190fd5b80548211156109d0576040805162461bcd60e51b815260206004820152601260248201527f4e6f7420656e6f7567682062616c616e63650000000000000000000000000000604482015290519081900360640190fd5b80546109dc90836119b7565b81556040805163a9059cbb60e01b81523360048201526024810184905290516001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169163a9059cbb9160448083019260209291908290030181600087803b158015610a4d57600080fd5b505af1158015610a61573d6000803e3d6000fd5b505050506040513d6020811015610a7757600080fd5b50505050565b6000546001600160a01b03163314610acd576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b61067681611a14565b3360009081526004602052604090205460ff16610b3a576040805162461bcd60e51b815260206004820152601860248201527f4e6f742061207265676973746572656420706c616e7465720000000000000000604482015290519081900360640190fd5b80826001600160a01b03166370a08231336040518263ffffffff1660e01b815260040180826001600160a01b0316815260200191505060206040518083038186803b158015610b8857600080fd5b505afa158015610b9c573d6000803e3d6000fd5b505050506040513d6020811015610bb257600080fd5b50511015610c07576040805162461bcd60e51b815260206004820152601960248201527f4e6f7420656e6f75676820746f6b656e2062616c616e63652e00000000000000604482015290519081900360640190fd5b600060056000610c156117cb565b815260200190815260200160002090506000610c968483600101805480602002602001604051908101604052809291908181526020018280548015610c8357602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311610c65575b5050505050611aa690919063ffffffff16565b50905080610cdb5760018281018054918201815560009081526020902001805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0386161790555b604080516323b872dd60e01b81523360048201523060248201526044810185905290516001600160a01b038616916323b872dd9160648083019260209291908290030181600087803b158015610d3057600080fd5b505af1158015610d44573d6000803e3d6000fd5b505050506040513d6020811015610d5a57600080fd5b50506001600160a01b0384166000908152600283016020526040902054610d819084611afd565b6001600160a01b039094166000908152600290920160205250604090209190915550565b600080610db061132a565b6001600160a01b0384166000908152600660205260408120600181015492935091831115610de057506000610ded565b8282600101546001010390505b949350505050565b600254610e49576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b600254421015610824576040805162461bcd60e51b815260206004820152601660248201527f43616e6e6f742064697362616e642074686520676f7600000000000000000000604482015290519081900360640190fd5b60015481565b600081815260056020908152604091829020600181018054845181850281018501909552808552606094859490929190830182828015610f0f57602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311610ef1575b50505050509250825167ffffffffffffffff81118015610f2e57600080fd5b50604051908082528060200260200182016040528015610f58578160200160208202803683370190505b50915060005b8351811015610fc7576000848281518110610f7557fe5b60200260200101519050826002016000826001600160a01b03166001600160a01b0316815260200190815260200160002054848381518110610fb357fe5b602090810291909101015250600101610f5e565b5050915091565b7f000000000000000000000000000000000000000000000000000000000000000081565b610ffa61132a565b81116110375760405162461bcd60e51b8152600401808060200182810382526023815260200180611c376023913960400191505060405180910390fd5b6000611043338361110d565b9050600061105133846110e0565b9050808210156110925760405162461bcd60e51b815260040180806020018281038252602a815260200180611c5a602a913960400191505060405180910390fd5b6000838152600560205260409020805482840391906110b19083611afd565b815533600090815260039091016020526040902092909255505050565b60056020526000908152604090205481565b60008181526005602090815260408083206001600160a01b03861684526003019091529020545b92915050565b6001600160a01b03821660009081526006602052604081206001810154829084111561113b57506000611148565b8382600101546001010390505b815461115490826118b7565b95945050505050565b6111668261118c565b61116f816113ba565b5050565b600061117d61132a565b90911115919050565b60025481565b33600081815260066020908152604080832081516323b872dd60e01b8152600481019590955230602486015260448501869052905190937f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316936323b872dd9360648084019491939192918390030190829087803b15801561121557600080fd5b505af1158015611229573d6000803e3d6000fd5b505050506040513d602081101561123f57600080fd5b5050805461124d9083611afd565b905550565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000546001600160a01b031633146112c6576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b6001600160a01b038116611321576040805162461bcd60e51b815260206004820152601860248201527f55736520616e61726368697a65282920696e73746561642e0000000000000000604482015290519081900360640190fd5b61067681611b57565b60007f00000000000000000000000000000000000000000000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000042038161137757fe5b04905090565b7f000000000000000000000000000000000000000000000000000000000000000081565b6006602052600090815260409020805460019091015482565b7f00000000000000000000000000000000000000000000000000000000000000008110156114195760405162461bcd60e51b8152600401808060200182810382526037815260200180611c846037913960400191505060405180910390fd5b7f00000000000000000000000000000000000000000000000000000000000000008111156114785760405162461bcd60e51b8152600401808060200182810382526034815260200180611be26034913960400191505060405180910390fd5b60008161148361132a565b336000908152600660205260409020600181015491909201925082116114da5760405162461bcd60e51b8152600401808060200182810382526022815260200180611bc06022913960400191505060405180910390fd5b6001015550565b6114ea81611173565b61153b576040805162461bcd60e51b815260206004820152600a60248201527f556e726970652079657400000000000000000000000000000000000000000000604482015290519081900360640190fd5b600081815260056020526040812090806115558433610688565b9150915060005b825181101561166b57600083828151811061157357fe5b60200260200101519050600083838151811061158b57fe5b602002602001015190506115cf81876002016000856001600160a01b03166001600160a01b03168152602001908152602001600020546119b790919063ffffffff16565b6001600160a01b0383166000818152600289016020908152604080832094909455835163a9059cbb60e01b8152336004820152602481018690529351929363a9059cbb9360448083019491928390030190829087803b15801561163157600080fd5b505af1158015611645573d6000803e3d6000fd5b505050506040513d602081101561165b57600080fd5b50506001909201915061155c9050565b503360009081526003840160205260409020548354611689916119b7565b835550503360009081526003909101602052604081205550565b6000546001600160a01b031633146116f3576040805162461bcd60e51b815260206004820152600e60248201526d139bdd08185d5d1a1bdc9a5e995960921b604482015290519081900360640190fd5b60025415611748576040805162461bcd60e51b815260206004820152600e60248201527f43616e6e6f74207570646174652e000000000000000000000000000000000000604482015290519081900360640190fd5b428110156117875760405162461bcd60e51b8152600401808060200182810382526022815260200180611cbb6022913960400191505060405180910390fd5b600255565b600061179733610da5565b905060006117a361132a565b905060005b828110156117c6576117be818360010101610ff2565b6001016117a8565b505050565b60006117d561132a565b600101905090565b6003546001600160a01b0316331461183c576040805162461bcd60e51b815260206004820181905260248201527f4f6e6c7920616c6c6f77656420746f2074686520696e6974696c61697a65722e604482015290519081900360640190fd5b61184582611a14565b61184e81611a14565b50506003805473ffffffffffffffffffffffffffffffffffffffff19169055565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000826118c657506000611107565b828202828482816118d357fe5b04146119105760405162461bcd60e51b8152600401808060200182810382526021815260200180611c166021913960400191505060405180910390fd5b9392505050565b600080821161196d576040805162461bcd60e51b815260206004820152601a60248201527f536166654d6174683a206469766973696f6e206279207a65726f000000000000604482015290519081900360640190fd5b81838161197657fe5b049392505050565b6119886000611b57565b426001556040517fbf30e910dd2b6e24c75c800d9f3477674e89a4b45e366f87cd03c99e0ba6496190600090a1565b600082821115611a0e576040805162461bcd60e51b815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b50900390565b6001600160a01b03811660009081526004602052604090205460ff1615611a82576040805162461bcd60e51b815260206004820152601260248201527f416c726561647920726567697374657265640000000000000000000000000000604482015290519081900360640190fd5b6001600160a01b03166000908152600460205260409020805460ff19166001179055565b60008060005b8451811015611af557836001600160a01b0316858281518110611acb57fe5b60200260200101516001600160a01b03161415611aed576001925090506107cd565b600101611aac565b509250929050565b600082820183811015611910576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b600080546040516001600160a01b03808516939216917f48da34dfe9ebb4198c3f70d8382467788dcee33984c79a74fa850772c4e5e36f91a36000805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b039290921691909117905556fe4974206f6e6c7920616c6c6f777320657874656e64696e6720746865206c6f636b2e53686f756c64206265206c657373206f7220657175616c207468616e20746865206d6178696d756d206c6f636b20706572696f64536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7743616e6e6f74206469737061746368206661726d65727320746f20746865207061737443616e6e6f7420776974686472617720616c72656164792064697370617463686564206661726d65727353686f756c642062652067726561746572206f7220657175616c207468616e20746865206d696e696d756d206c6f636b20706572696f6454696d65706f696e742073686f756c6420626520696e20746865206675747572652ea2646970667358221220c396c7b693853a76ee76e02e42a38c0a6a7f17586713e13b5b88a4c72fd4e22264736f6c63430007060033";
