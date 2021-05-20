/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { RIGHT } from "../RIGHT";

export class RIGHT__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<RIGHT> {
    return super.deploy(overrides || {}) as Promise<RIGHT>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): RIGHT {
    return super.attach(address) as RIGHT;
  }
  connect(signer: Signer): RIGHT__factory {
    return super.connect(signer) as RIGHT__factory;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): RIGHT {
    return new Contract(address, _abi, signerOrProvider) as RIGHT;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
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
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "balanceOfAt",
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
        name: "veLockId",
        type: "uint256",
      },
    ],
    name: "balanceOfLock",
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
        name: "veLockId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "balanceOfLockAt",
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
        name: "veLockId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
        ],
        internalType: "struct Lock",
        name: "oldLock",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
        ],
        internalType: "struct Lock",
        name: "newLock",
        type: "tuple",
      },
    ],
    name: "checkpoint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "maxRecord",
        type: "uint256",
      },
    ],
    name: "checkpoint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_veTokenName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_veTokenSymbol",
        type: "string",
      },
      {
        internalType: "address",
        name: "_veLocker",
        type: "address",
      },
    ],
    name: "initialize",
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
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "lockPointHistory",
    outputs: [
      {
        internalType: "int128",
        name: "bias",
        type: "int128",
      },
      {
        internalType: "int128",
        name: "slope",
        type: "int128",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
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
    name: "pointHistory",
    outputs: [
      {
        internalType: "int128",
        name: "bias",
        type: "int128",
      },
      {
        internalType: "int128",
        name: "slope",
        type: "int128",
      },
      {
        internalType: "uint256",
        name: "timestamp",
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
    name: "slopeChanges",
    outputs: [
      {
        internalType: "int128",
        name: "",
        type: "int128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
    name: "totalSupplyAt",
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
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
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
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
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
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b506040805160208082018084526000808452845192830190945292815281519192909162000042916003916200006e565b508051620000589060049060208401906200006e565b50506005805460ff19166012179055506200011a565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282620000a65760008555620000f1565b82601f10620000c157805160ff1916838001178555620000f1565b82800160010185558215620000f1579182015b82811115620000f1578251825591602001919060010190620000d4565b50620000ff92915062000103565b5090565b5b80821115620000ff576000815560010162000104565b612140806200012a6000396000f3fe608060405234801561001057600080fd5b50600436106101825760003560e01c8063642cf649116100d8578063a457c2d71161008c578063dd62ed3e11610066578063dd62ed3e14610314578063ed64bab214610327578063f52a36f71461033a57610182565b8063a457c2d7146102db578063a9059cbb146102ee578063b94419e01461030157610182565b80638ad4c447116100bd5780638ad4c447146102ad57806395d89b41146102c0578063981b24d0146102c857610182565b8063642cf6491461028757806370a082311461029a57610182565b806323b872dd1161013a5780633950935111610114578063395093511461024e5780633bd42082146102615780634ee2cd7e1461027457610182565b806323b872dd14610204578063313ce56714610217578063367b7b231461022c57610182565b8063095ea7b31161016b578063095ea7b3146101ba57806314f57a4b146101da57806318160ddd146101ef57610182565b806306fdde0314610187578063077f224a146101a5575b600080fd5b61018f61035a565b60405161019c9190611dc3565b60405180910390f35b6101b86101b3366004611c14565b6103f0565b005b6101cd6101c8366004611beb565b610502565b60405161019c9190611d8c565b6101e2610520565b60405161019c9190611d5f565b6101f7610536565b60405161019c9190611f75565b6101cd610212366004611bb0565b610546565b61021f6105ce565b60405161019c9190611f7e565b61023f61023a366004611d3e565b6105d7565b60405161019c93929190611da5565b6101cd61025c366004611beb565b610622565b6101b861026f366004611d0a565b610670565b6101f7610282366004611beb565b61071b565b6101f7610295366004611d3e565b610860565b6101f76102a8366004611b64565b6108d9565b61023f6102bb366004611cda565b610a1e565b61018f610a5c565b6101f76102d6366004611cda565b610abd565b6101cd6102e9366004611beb565b610af5565b6101cd6102fc366004611beb565b610b5d565b6101f761030f366004611cda565b610b71565b6101f7610322366004611b7e565b610b7d565b6101b8610335366004611cda565b610ba8565b61034d610348366004611cda565b610bb4565b60405161019c9190611d97565b60098054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156103e65780601f106103bb576101008083540402835291602001916103e6565b820191906000526020600020905b8154815290600101906020018083116103c957829003601f168201915b5050505050905090565b60055462010000900460ff168061040a575061040a610bc9565b8061041d5750600554610100900460ff16155b6104585760405162461bcd60e51b815260040180806020018281038252602e81526020018061201f602e913960400191505060405180910390fd5b60055462010000900460ff16158015610488576005805461ff001962ff0000199091166201000017166101001790555b835161049b906009906020870190611a04565b5082516104af90600a906020860190611a04565b50600580547fffffffffffffffffff0000000000000000000000000000000000000000ffffff1663010000006001600160a01b0385160217905580156104fc576005805462ff0000191690555b50505050565b600061051661050f610bda565b8484610bde565b5060015b92915050565b600554630100000090046001600160a01b031681565b600061054142610abd565b905090565b6000610553848484610cca565b6105c38461055f610bda565b6105be8560405180606001604052806028815260200161204d602891396001600160a01b038a1660009081526001602052604081209061059d610bda565b6001600160a01b031681526020810191909152604001600020549190610e25565b610bde565b5060015b9392505050565b60055460ff1690565b600860205281600052604060002081815481106105f357600080fd5b600091825260209091206002909102018054600190910154600f82810b9450600160801b90920490910b915083565b600061051661062f610bda565b846105be8560016000610640610bda565b6001600160a01b03908116825260208083019390935260409182016000908120918c168152925290205490610ebc565b600554630100000090046001600160a01b031633146106aa5760405162461bcd60e51b81526004016106a190611e84565b60405180910390fd5b6106b46000610f16565b6000806106dd6106c936869003860186611c85565b6106d836869003860186611c85565b61112f565b915091506106eb82826111d6565b610714856106fe36879003870187611c85565b61070d36879003870187611c85565b8585611395565b5050505050565b6005546040516370a0823160e01b8152600091829163010000009091046001600160a01b0316906370a0823190610756908790600401611d5f565b60206040518083038186803b15801561076e57600080fd5b505afa158015610782573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107a69190611cf2565b90506000805b8281101561085757600554604051632f745c5960e01b8152600091630100000090046001600160a01b031690632f745c59906107ee908a908690600401611d73565b60206040518083038186803b15801561080657600080fd5b505afa15801561081a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061083e9190611cf2565b905061084a8187610860565b90920191506001016107ac565b50949350505050565b60008281526008602052604081208190819061087c90856115ac565b9150915081156108ce5760006108958260400151611758565b61089e86611758565b038260200151028260000151039050600081600f0b136108bf5760006108c4565b80600f0b5b935050505061051a565b60009250505061051a565b6005546040516370a0823160e01b8152600091829163010000009091046001600160a01b0316906370a0823190610914908690600401611d5f565b60206040518083038186803b15801561092c57600080fd5b505afa158015610940573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109649190611cf2565b90506000805b82811015610a1457600554604051632f745c5960e01b8152600091630100000090046001600160a01b031690632f745c59906109ac9089908690600401611d73565b60206040518083038186803b1580156109c457600080fd5b505afa1580156109d8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109fc9190611cf2565b9050610a0781610b71565b909201915060010161096a565b509150505b919050565b60078181548110610a2e57600080fd5b600091825260209091206002909102018054600190910154600f82810b9350600160801b90920490910b9083565b600a8054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156103e65780601f106103bb576101008083540402835291602001916103e6565b6000806000610acd6007856115ac565b915091508115610aea57610ae1818561176b565b92505050610a19565b600092505050610a19565b6000610516610b02610bda565b846105be856040518060600160405280602581526020016120e66025913960016000610b2c610bda565b6001600160a01b03908116825260208083019390935260409182016000908120918d16815292529020549190610e25565b6000610516610b6a610bda565b8484610cca565b600061051a8242610860565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b610bb181610f16565b50565b600660205260009081526040902054600f0b81565b6000610bd430611889565b15905090565b3390565b6001600160a01b038316610c235760405162461bcd60e51b815260040180806020018281038252602481526020018061209a6024913960400191505060405180910390fd5b6001600160a01b038216610c685760405162461bcd60e51b8152600401808060200182810382526022815260200180611fb06022913960400191505060405180910390fd5b6001600160a01b03808416600081815260016020908152604080832094871680845294825291829020859055815185815291517f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259281900390910190a3505050565b6001600160a01b038316610d0f5760405162461bcd60e51b81526004018080602001828103825260258152602001806120756025913960400191505060405180910390fd5b6001600160a01b038216610d545760405162461bcd60e51b8152600401808060200182810382526023815260200180611f8d6023913960400191505060405180910390fd5b610d5f83838361188f565b610d9c81604051806060016040528060268152602001611fd2602691396001600160a01b0386166000908152602081905260409020549190610e25565b6001600160a01b038085166000908152602081905260408082209390935590841681522054610dcb9082610ebc565b6001600160a01b038084166000818152602081815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b60008184841115610eb45760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610e79578181015183820152602001610e61565b50505050905090810190601f168015610ea65780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b6000828201838110156105c7576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b610f1e611a8c565b60075415610f8b57600780546000198101908110610f3857fe5b60009182526020918290206040805160608101825260029093029091018054600f81810b810b810b8552600160801b909104810b810b900b93830193909352600190920154918101919091529050610fa9565b50604080516060810182526000808252602082015242918101919091525b6040810151429062093a80908190040260005b610fcb8262093a8001846118a7565b91506000610fde83850362093a806118a7565b60408087018590526020808801805189519085029003600f90810b810b8a526000888152600690935292822054815190840b01830b830b9052875192935091900b1361102b57600061102e565b84515b600f90810b810b865260208601516000910b1361104c576000611052565b84602001515b600f90810b810b602087019081526007805460018181018355600092909252885160029091027fa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c688810180549451860b6fffffffffffffffffffffffffffffffff908116600160801b029390960b86166fffffffffffffffffffffffffffffffff19909516949094179094161790915560408701517fa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c689909201919091559190910190508282148015906111245750848114155b610fbc575050505050565b611137611a8c565b61113f611a8c565b4284604001511180156111525750835115155b1561118857835161116a90630784ce00905b04611758565b600f90810b810b60208401819052604086015142900302810b900b82525b42836040015111801561119b5750825115155b156111cf5782516111b190630784ce0090611164565b600f90810b810b60208301819052604085015142900302810b900b81525b9250929050565b6007546112a357604080516060810182526000808252602082018181524293830193845260078054600181018255925291517fa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c6886002909202918201805493516fffffffffffffffffffffffffffffffff19909416600f92830b6fffffffffffffffffffffffffffffffff908116919091178116600160801b9590930b16939093021790915590517fa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c689909101555b600061131083836007600160078054905003815481106112bf57fe5b60009182526020918290206040805160608101825260029093029091018054600f81810b810b810b8552600160801b909104810b810b900b93830193909352600190920154918101919091526118bd565b600780549192508291600019810190811061132757fe5b60009182526020918290208351600290920201805492840151600f90810b6fffffffffffffffffffffffffffffffff908116600160801b029390910b81166fffffffffffffffffffffffffffffffff1990941693909317909216178155604090910151600190910155505050565b604084015162093a80810462093a8002146113c25760405162461bcd60e51b81526004016106a190611ee1565b604083015162093a80810462093a8002146113ef5760405162461bcd60e51b81526004016106a190611ee1565b604080850151600090815260066020528181205491850151600f9290920b91156114415785604001518560400151141561142a575080611441565b50604080850151600090815260066020522054600f0b5b42866040015111156114b157836020015182019150856040015185604001511415611470578260200151820391505b604086810151600090815260066020522080546fffffffffffffffffffffffffffffffff19166fffffffffffffffffffffffffffffffff600f85900b161790555b4285604001511115611520578560400151856040015111156115205760208084015160408088015160009081526006909352909120805491909203600f81900b6fffffffffffffffffffffffffffffffff166fffffffffffffffffffffffffffffffff19909216919091179091555b505042604080830191825260009687526008602090815290872080546001818101835591895297829020845160029099020180549290940151600f90810b6fffffffffffffffffffffffffffffffff908116600160801b029990910b81166fffffffffffffffffffffffffffffffff199093169290921790911696909617825551940193909355505050565b60006115b6611a8c565b428311156115d65760405162461bcd60e51b81526004016106a190611e16565b83546115e557600091506111cf565b836000815481106115f257fe5b90600052602060002090600202016001015483101561161457600091506111cf565b428314156116875783546001908590600019810190811061163157fe5b60009182526020918290206040805160608101825260029093029091018054600f81810b810b810b8552600160801b909104810b810b900b938301939093526001909201549181019190915290925090506111cf565b83546000906000190181805b60808110156116ee578284106116a8576116ee565b6002600185850101049150868883815481106116c057fe5b906000526020600020906002020160010154116116df578193506116e6565b6001820392505b600101611693565b5060018784815481106116fd57fe5b60009182526020918290206040805160608101825260029093029091018054600f81810b810b810b8552600160801b909104810b810b900b938301939093526001909201549181019190915290955093505050509250929050565b600061051a61176683611924565b611988565b600081836040015111156117915760405162461bcd60e51b81526004016106a190611e4d565b6040830151839062093a8090819004025b6117b18162093a8001856118a7565b905060006117c482860362093a806118a7565b60408085018490526020808601805187519085029003600f90810b810b88526000878152600690935292822054815190840b01830b830b9052855192935091900b13611811576000611814565b82515b600f90810b810b845260208401516000910b13611832576000611838565b82602001515b600f90810b900b602084015250838114156117a257600061185a828603611758565b8360200151028360000151039050600081600f0b1361187a57600061187f565b80600f0b5b9695505050505050565b3b151590565b60405162461bcd60e51b81526004016106a190611f18565b60008183106118b657816105c7565b5090919050565b6118c5611a8c565b506020808401518382015191830180519190920301600f90810b810b9182905284518451845191900301810b810b835282916000910b121561190957600060208201525b60008160000151600f0b12156105c757600081529392505050565b60007f800000000000000000000000000000000000000000000000000000000000000082106119845760405162461bcd60e51b81526004018080602001828103825260288152602001806120be6028913960400191505060405180910390fd5b5090565b60007fffffffffffffffffffffffffffffffff8000000000000000000000000000000082121580156119c957506f8000000000000000000000000000000082125b6119845760405162461bcd60e51b8152600401808060200182810382526027815260200180611ff86027913960400191505060405180910390fd5b828054600181600116156101000203166002900490600052602060002090601f016020900481019282611a3a5760008555611a80565b82601f10611a5357805160ff1916838001178555611a80565b82800160010185558215611a80579182015b82811115611a80578251825591602001919060010190611a65565b50611984929150611aac565b604080516060810182526000808252602082018190529181019190915290565b5b808211156119845760008155600101611aad565b80356001600160a01b0381168114610a1957600080fd5b600082601f830112611ae8578081fd5b813567ffffffffffffffff80821115611afd57fe5b604051601f8301601f191681016020018281118282101715611b1b57fe5b604052828152848301602001861015611b32578384fd5b82602086016020830137918201602001929092529392505050565b600060608284031215611b5e578081fd5b50919050565b600060208284031215611b75578081fd5b6105c782611ac1565b60008060408385031215611b90578081fd5b611b9983611ac1565b9150611ba760208401611ac1565b90509250929050565b600080600060608486031215611bc4578081fd5b611bcd84611ac1565b9250611bdb60208501611ac1565b9150604084013590509250925092565b60008060408385031215611bfd578182fd5b611c0683611ac1565b946020939093013593505050565b600080600060608486031215611c28578283fd5b833567ffffffffffffffff80821115611c3f578485fd5b611c4b87838801611ad8565b94506020860135915080821115611c60578384fd5b50611c6d86828701611ad8565b925050611c7c60408501611ac1565b90509250925092565b600060608284031215611c96578081fd5b6040516060810181811067ffffffffffffffff82111715611cb357fe5b80604052508235815260208301356020820152604083013560408201528091505092915050565b600060208284031215611ceb578081fd5b5035919050565b600060208284031215611d03578081fd5b5051919050565b600080600060e08486031215611d1e578283fd5b83359250611d2f8560208601611b4d565b9150611c7c8560808601611b4d565b60008060408385031215611d50578182fd5b50508035926020909101359150565b6001600160a01b0391909116815260200190565b6001600160a01b03929092168252602082015260400190565b901515815260200190565b600f9190910b815260200190565b600f93840b81529190920b6020820152604081019190915260600190565b6000602080835283518082850152825b81811015611def57858101830151858201604001528201611dd3565b81811115611e005783604083870101525b50601f01601f1916929092016040019392505050565b60208082526010908201527f4f6e6c79207061737420626c6f636b7300000000000000000000000000000000604082015260600190565b6020808252601a908201527f7363616e206f6e6c7920746f2074686520726967687477617264000000000000604082015260600190565b60208082526024908201527f4f6e6c79207665206c6f636b20636f6e74726163742063616e2063616c6c207460408201527f6869732e00000000000000000000000000000000000000000000000000000000606082015260800190565b6020808252601f908201527f73686f756c642062652065786163742065706f63682074696d657374616d7000604082015260600190565b6020808252602f908201527f4e6f6e2d7472616e736665727261626c652e20596f752063616e206f6e6c792060408201527f7472616e73666572206c6f636b732e0000000000000000000000000000000000606082015260800190565b90815260200190565b60ff9190911681526020019056fe45524332303a207472616e7366657220746f20746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636553616665436173743a2076616c756520646f65736e27742066697420696e203132382062697473496e697469616c697a61626c653a20636f6e747261637420697320616c726561647920696e697469616c697a656445524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737353616665436173743a2076616c756520646f65736e27742066697420696e20616e20696e7432353645524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa2646970667358221220b6c0b225f8a5be42481fb6a38086e60791358d329dd1f40debad40b43ad19c4964736f6c63430007060033";
