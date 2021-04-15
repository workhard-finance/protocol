/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { FarmersUnion } from "../FarmersUnion";

export class FarmersUnion__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _visionFarm: string,
    _voteCounter: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<FarmersUnion> {
    return super.deploy(
      _visionFarm,
      _voteCounter,
      overrides || {}
    ) as Promise<FarmersUnion>;
  }
  getDeployTransaction(
    _visionFarm: string,
    _voteCounter: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _visionFarm,
      _voteCounter,
      overrides || {}
    );
  }
  attach(address: string): FarmersUnion {
    return super.attach(address) as FarmersUnion;
  }
  connect(signer: Signer): FarmersUnion__factory {
    return super.connect(signer) as FarmersUnion__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FarmersUnion {
    return new Contract(address, _abi, signerOrProvider) as FarmersUnion;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_visionFarm",
        type: "address",
      },
      {
        internalType: "address",
        name: "_voteCounter",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "txHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "target",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "BatchTxProposed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "txHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "batchTx",
        type: "bool",
      },
    ],
    name: "NewProposal",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "proposalIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "txHash",
        type: "bytes32",
      },
    ],
    name: "ProposalExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "txHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "TxProposed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "forVote",
        type: "bool",
      },
    ],
    name: "Vote",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "forVotes",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "againsVotes",
        type: "uint256",
      },
    ],
    name: "VoteUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "NO_DEPENDENCY",
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
        name: "minimumPendingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximumPendingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumVotingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximumVotingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumVotesForProposing",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumVotes",
        type: "uint256",
      },
      {
        internalType: "contract IVoteCounter",
        name: "voteCounter",
        type: "address",
      },
    ],
    name: "changeMemorandom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
      {
        internalType: "address[]",
        name: "target",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]",
      },
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
      {
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "executeBatch",
    outputs: [],
    stateMutability: "payable",
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
    name: "getVotes",
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
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "getVotingStatus",
    outputs: [
      {
        internalType: "enum FarmersUnion.VotingState",
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
        internalType: "address[]",
        name: "target",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]",
      },
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
      {
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "hashBatchTransaction",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "hashTransaction",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "launch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "memorandom",
    outputs: [
      {
        internalType: "uint256",
        name: "minimumPending",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximumPending",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumVotingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximumVotingPeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumVotesForProposing",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumVotes",
        type: "uint256",
      },
      {
        internalType: "contract IVoteCounter",
        name: "voteCounter",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
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
    name: "proposals",
    outputs: [
      {
        internalType: "address",
        name: "proposer",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "txHash",
        type: "bytes32",
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
      {
        internalType: "uint256",
        name: "totalForVotes",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalAgainstVotes",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "executed",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "target",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]",
      },
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
      {
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startsIn",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "votingPeriod",
        type: "uint256",
      },
    ],
    name: "proposeBatchTx",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "predecessor",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startsIn",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "votingPeriod",
        type: "uint256",
      },
    ],
    name: "proposeTx",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "visionFarm",
    outputs: [
      {
        internalType: "contract VisionFarm",
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
        name: "proposalId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "agree",
        type: "bool",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b50604051620022b5380380620022b58339810160408190526200003491620001cc565b600080546001600160a01b03808516610100026001600160a81b0319909216919091179091556040805160e0810182526201518080825262093a80602083018190529282018390526224ea006060830181905264174876e8006080840181905264e8d4a5100060a0850181905295871660c09094018490526001929092556002849055600393909355600492909255600591909155600691909155600780546001600160a01b0319169091179055620000ec620000fd565b50506224ea00420160095562000203565b62000107620001a2565b156200014d576040805162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b604482015290519081900360640190fd5b6000805460ff191660011790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25862000185620001ab565b604080516001600160a01b039092168252519081900360200190a1565b60005460ff1690565b3390565b80516001600160a01b0381168114620001c757600080fd5b919050565b60008060408385031215620001df578182fd5b620001ea83620001af565b9150620001fa60208401620001af565b90509250929050565b6120a280620002136000396000f3fe6080604052600436106100f75760003560e01c80638f6339941161008a578063b9c3982511610059578063b9c39825146102af578063c9bc4574146102c2578063c9d27afe146102d7578063e67db28b146102f7576100fe565b80638f633994146102225780639ab24eb01461024f578063a977407a1461026f578063aa91ecbc1461028f576100fe565b8063547e8ff3116100c6578063547e8ff3146101a55780635c975abb146101b8578063652f70cc146101da5780637851450314610202576100fe565b806301339c2114610103578063013cf08b1461011a5780634a548de7146101565780634edc9bf914610183576100fe565b366100fe57005b600080fd5b34801561010f57600080fd5b50610118610317565b005b34801561012657600080fd5b5061013a61013536600461170e565b61034c565b60405161014d97969594939291906119d0565b60405180910390f35b34801561016257600080fd5b506101766101713660046114ca565b6103a8565b60405161014d9190611b16565b34801561018f57600080fd5b506101986103e7565b60405161014d91906119bc565b6101186101b33660046117b5565b6103fb565b3480156101c457600080fd5b506101cd6104dc565b60405161014d9190611b0b565b3480156101e657600080fd5b506101ef6104e5565b60405161014d9796959493929190611fb5565b34801561020e57600080fd5b5061011861021d36600461189a565b610506565b34801561022e57600080fd5b5061024261023d36600461170e565b610885565b60405161014d9190611b2f565b34801561025b57600080fd5b5061017661026a366004611492565b610949565b34801561027b57600080fd5b5061017661028a3660046115b3565b6109d0565b34801561029b57600080fd5b506101186102aa366004611536565b610a15565b6101186102bd36600461173e565b610a89565b3480156102ce57600080fd5b50610176610ac6565b3480156102e357600080fd5b506101186102f2366004611867565b610acc565b34801561030357600080fd5b50610118610312366004611658565b610cda565b6009544210156103425760405162461bcd60e51b815260040161033990611d69565b60405180910390fd5b61034a610db0565b565b6008818154811061035c57600080fd5b600091825260209091206009909102018054600182015460028301546003840154600485015460058601546006909601546001600160a01b039095169650929491939092919060ff1687565b60008686868686866040516020016103c596959493929190611a0d565b6040516020818303038152906040528051906020012090509695505050505050565b60005461010090046001600160a01b031681565b86851461041a5760405162461bcd60e51b815260040161033990611b43565b8683146104395760405162461bcd60e51b815260040161033990611b43565b600061044b89898989898989896109d0565b9050610458838b83610e59565b60005b888110156104c5576104bd8a8a8381811061047257fe5b90506020020160208101906104879190611492565b89898481811061049357fe5b905060200201358888858181106104a657fe5b90506020028101906104b89190611fee565b610f0a565b60010161045b565b506104d08a82610f91565b50505050505050505050565b60005460ff1690565b6001546002546003546004546005546006546007546001600160a01b031687565b3330146105255760405162461bcd60e51b815260040161033990611eea565b60008060019054906101000a90046001600160a01b03166001600160a01b031663d751dc786040518163ffffffff1660e01b815260040160206040518083038186803b15801561057457600080fd5b505afa158015610588573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105ac9190611726565b905060008060019054906101000a90046001600160a01b03166001600160a01b031663f2fd83e06040518163ffffffff1660e01b815260040160206040518083038186803b1580156105fd57600080fd5b505afa158015610611573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061063591906114ae565b6001600160a01b03166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b15801561066d57600080fd5b505afa158015610681573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106a59190611726565b905060006106bb6106b68385611004565b611064565b9050888a11156106dd5760405162461bcd60e51b815260040161033990611da0565b868811156106fd5760405162461bcd60e51b815260040161033990611da0565b620151808810156107205760405162461bcd60e51b815260040161033990611cfb565b620151808a10156107435760405162461bcd60e51b815260040161033990611cfb565b62278d008811156107665760405162461bcd60e51b815260040161033990611cc4565b62278d008a11156107895760405162461bcd60e51b815260040161033990611cc4565b6107948160646110b5565b8611156107b35760405162461bcd60e51b815260040161033990611c56565b6107be81600a6110b5565b8511156107dd5760405162461bcd60e51b815260040161033990611c56565b6001600160a01b0384166108035760405162461bcd60e51b815260040161033990611c1f565b50506040805160e08101825289815260208101899052908101879052606081018690526080810185905260a081018490526001600160a01b0390921660c0909201829052506001969096556002949094556003929092556004556005556006556007805473ffffffffffffffffffffffffffffffffffffffff19169091179055565b6000806008838154811061089557fe5b906000526020600020906009020190508060020154600014156108ca5760405162461bcd60e51b815260040161033990611c8d565b80600201544210156108e0576000915050610944565b806003015442116108f5576001915050610944565b600681015460ff161561090c576004915050610944565b60065460048201541015610924576003915050610944565b80600501548160040154111561093e576002915050610944565b60039150505b919050565b6007546040516309ab24eb60e41b81526000916001600160a01b031690639ab24eb09061097a9085906004016119bc565b60206040518083038186803b15801561099257600080fd5b505afa1580156109a6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109ca9190611726565b92915050565b600088888888888888886040516020016109f1989796959493929190611a4b565b60405160208183030381529060405280519060200120905098975050505050505050565b610a1f828261111c565b6000610a2f8989898989896103a8565b9050610a3c81848461124c565b807fbf93fc6a5e913d6a8ece4580af2763d0b1f20dab56ab515e109157b374227c7f8a8a8a8a8a8a604051610a7696959493929190611a0d565b60405180910390a2505050505050505050565b6000610a998787878787876103a8565b9050610aa6838983610e59565b610ab287878787610f0a565b610abc8882610f91565b5050505050505050565b60001981565b600060088381548110610adb57fe5b6000918252602090912060099091020190506001610af884610885565b6004811115610b0357fe5b14610b205760405162461bcd60e51b815260040161033990611b7a565b336000818152600783810160209081526040808420546008870190925280842054925490516309ab24eb60e41b815291949293926001600160a01b0390911691639ab24eb091610b72916004016119bc565b60206040518083038186803b158015610b8a57600080fd5b505afa158015610b9e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610bc29190611726565b905084610bd0576000610bd2565b805b33600090815260078601602052604090205584610bef5780610bf2565b60005b336000908152600886016020526040902055610c2a83610c2487610c17576000610c19565b835b60048801549061134e565b906113a8565b6004850155610c4f82610c2487610c415783610c44565b60005b60058801549061134e565b60058501556040517fcfa82ef0390c8f3e57ebe6c0665352a383667e792af012d350d9786ee5173d2690610c8890889033908990611f7e565b60405180910390a1600484015460058501546040517f37264ddc7affad6dd0ce49b5762a1a19b4abffd54f202f2b3e7d711f3eb56a0a92610cca928a92611f9f565b60405180910390a1505050505050565b610ce26104dc565b15610d34576040805162461bcd60e51b815260206004820152601060248201527f5061757361626c653a2070617573656400000000000000000000000000000000604482015290519081900360640190fd5b610d3e828261111c565b6000610d508b8b8b8b8b8b8b8b6109d0565b9050610d5d81848461124c565b807f3e65198dc9f3fcbc5a6beba3656bd58ac57ed4c710df48fbb7a79b11270e45698c8c8c8c8c8c8c8c604051610d9b989796959493929190611a4b565b60405180910390a25050505050505050505050565b610db86104dc565b610e09576040805162461bcd60e51b815260206004820152601460248201527f5061757361626c653a206e6f7420706175736564000000000000000000000000604482015290519081900360640190fd5b6000805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa610e3c611405565b604080516001600160a01b039092168252519081900360200190a1565b6000198314610e95576004610e6d84610885565b6004811115610e7857fe5b14610e955760405162461bcd60e51b815260040161033990611e45565b6002610ea083610885565b6004811115610eab57fe5b14610ec85760405162461bcd60e51b815260040161033990611bb1565b8060088381548110610ed657fe5b90600052602060002090600902016001015414610f055760405162461bcd60e51b815260040161033990611e0e565b505050565b6000846001600160a01b0316848484604051610f279291906119ac565b60006040518083038185875af1925050503d8060008114610f64576040519150601f19603f3d011682016040523d82523d6000602084013e610f69565b606091505b5050905080610f8a5760405162461bcd60e51b815260040161033990611f21565b5050505050565b600160088381548110610fa057fe5b906000526020600020906009020160060160006101000a81548160ff021916908315150217905550817f56a007d3eea04bd347e571f3451382cb2a33ef5fd102b9a63846ff8d787f43cf82604051610ff89190611b16565b60405180910390a25050565b600082611013575060006109ca565b8282028284828161102057fe5b041461105d5760405162461bcd60e51b815260040180806020018281038252602181526020018061204c6021913960400191505060405180910390fd5b9392505050565b600060038211156110a7575080600160028204015b818110156110a15780915060028182858161109057fe5b04018161109957fe5b049050611079565b50610944565b811561094457506001919050565b600080821161110b576040805162461bcd60e51b815260206004820152601a60248201527f536166654d6174683a206469766973696f6e206279207a65726f000000000000604482015290519081900360640190fd5b81838161111457fe5b049392505050565b6007546040516309ab24eb60e41b81526000916001600160a01b031690639ab24eb09061114d9033906004016119bc565b60206040518083038186803b15801561116557600080fd5b505afa158015611179573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061119d9190611726565b90508060016004015411156111c45760405162461bcd60e51b815260040161033990611be8565b6001548310156111e65760405162461bcd60e51b815260040161033990611eb3565b6002548311156112085760405162461bcd60e51b815260040161033990611d32565b60035482101561122a5760405162461bcd60e51b815260040161033990611e7c565b600454821115610f055760405162461bcd60e51b815260040161033990611dd7565b6112546104dc565b156112a6576040805162461bcd60e51b815260206004820152601060248201527f5061757361626c653a2070617573656400000000000000000000000000000000604482015290519081900360640190fd5b6008805460018101808355600083815292919081106112c157fe5b600091825260208220600990910201805473ffffffffffffffffffffffffffffffffffffffff19163317815560018101869055428501600282018190558401600382015560085460405191935060001901917f53e7ed311b4044ee7a8a40384a063f6d5fae4c51a22cd3e1cecea9533358996491611340918891611b1f565b60405180910390a250505050565b60008282018381101561105d576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b6000828211156113ff576040805162461bcd60e51b815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b50900390565b3390565b60008083601f84011261141a578182fd5b50813567ffffffffffffffff811115611431578182fd5b602083019150836020808302850101111561144b57600080fd5b9250929050565b60008083601f840112611463578182fd5b50813567ffffffffffffffff81111561147a578182fd5b60208301915083602082850101111561144b57600080fd5b6000602082840312156114a3578081fd5b813561105d81612033565b6000602082840312156114bf578081fd5b815161105d81612033565b60008060008060008060a087890312156114e2578182fd5b86356114ed81612033565b955060208701359450604087013567ffffffffffffffff81111561150f578283fd5b61151b89828a01611452565b979a9699509760608101359660809091013595509350505050565b60008060008060008060008060e0898b031215611551578182fd5b883561155c81612033565b975060208901359650604089013567ffffffffffffffff81111561157e578283fd5b61158a8b828c01611452565b999c989b50996060810135986080820135985060a0820135975060c09091013595509350505050565b60008060008060008060008060a0898b0312156115ce578384fd5b883567ffffffffffffffff808211156115e5578586fd5b6115f18c838d01611409565b909a50985060208b0135915080821115611609578586fd5b6116158c838d01611409565b909850965060408b013591508082111561162d578586fd5b5061163a8b828c01611409565b999c989b509699959896976060870135966080013595509350505050565b60008060008060008060008060008060e08b8d031215611676578182fd5b8a3567ffffffffffffffff8082111561168d578384fd5b6116998e838f01611409565b909c509a5060208d01359150808211156116b1578384fd5b6116bd8e838f01611409565b909a50985060408d01359150808211156116d5578384fd5b506116e28d828e01611409565b9b9e9a9d50989b979a98996060890135986080810135985060a0810135975060c0013595509350505050565b60006020828403121561171f578081fd5b5035919050565b600060208284031215611737578081fd5b5051919050565b600080600080600080600060c0888a031215611758578081fd5b87359650602088013561176a81612033565b955060408801359450606088013567ffffffffffffffff81111561178c578182fd5b6117988a828b01611452565b989b979a50959895979660808701359660a0013595509350505050565b600080600080600080600080600060c08a8c0312156117d2578283fd5b8935985060208a013567ffffffffffffffff808211156117f0578485fd5b6117fc8d838e01611409565b909a50985060408c0135915080821115611814578485fd5b6118208d838e01611409565b909850965060608c0135915080821115611838578485fd5b506118458c828d01611409565b9a9d999c50979a96999598959660808101359660a09091013595509350505050565b60008060408385031215611879578182fd5b823591506020830135801515811461188f578182fd5b809150509250929050565b600080600080600080600060e0888a0312156118b4578081fd5b873596506020880135955060408801359450606088013593506080880135925060a0880135915060c08801356118e981612033565b8091505092959891949750929550565b60008284526020808501945084818502860184845b878110156119755783830389528135601e1988360301811261192e578687fd5b8701803567ffffffffffffffff811115611946578788fd5b803603891315611954578788fd5b6119618582898501611982565b9a87019a945050509084019060010161190e565b5090979650505050505050565b60008284528282602086013780602084860101526020601f19601f85011685010190509392505050565b6000828483379101908152919050565b6001600160a01b0391909116815260200190565b6001600160a01b03979097168752602087019590955260408601939093526060850191909152608084015260a0830152151560c082015260e00190565b60006001600160a01b038816825286602083015260a06040830152611a3660a083018688611982565b60608301949094525060800152949350505050565b60a0808252810188905260008960c08301825b8b811015611a8e578235611a7181612033565b6001600160a01b0316825260209283019290910190600101611a5e565b5083810360208501528881527f07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff891115611ac6578283fd5b602089029150818a60208301370160208181018381528483039091016040850152611af281888a6118f9565b6060850196909652505050608001529695505050505050565b901515815260200190565b90815260200190565b9182521515602082015260400190565b6020810160058310611b3d57fe5b91905290565b6020808252600f908201527f6c656e677468206d69736d617463680000000000000000000000000000000000604082015260600190565b60208082526018908201527f4e6f7420696e2074686520766f74696e6720706572696f640000000000000000604082015260600190565b60208082526012908201527f766f7465206973206e6f74207061737365640000000000000000000000000000604082015260600190565b6020808252601f908201527f4e6f7420656e6f75676820766f74657320666f722070726f706f73696e672e00604082015260600190565b6020808252600c908201527f6e756c6c20616464726573730000000000000000000000000000000000000000604082015260600190565b60208082526010908201527f746f6f206c61726765206e756d62657200000000000000000000000000000000604082015260600190565b60208082526018908201527f4e6f7420616e206578697374696e672070726f706f73616c0000000000000000604082015260600190565b60208082526008908201527f746f6f206c6f6e67000000000000000000000000000000000000000000000000604082015260600190565b60208082526009908201527f746f6f2073686f72740000000000000000000000000000000000000000000000604082015260600190565b6020808252601b908201527f50656e64696e6720706572696f6420697320746f6f206c6f6e672e0000000000604082015260600190565b60208082526012908201527f5761697420612062697420706c656173652e0000000000000000000000000000604082015260600190565b6020808252600b908201527f696e76616c696420617267000000000000000000000000000000000000000000604082015260600190565b6020808252601a908201527f566f74696e6720706572696f6420697320746f6f206c6f6e672e000000000000604082015260600190565b6020808252600f908201527f696e76616c696420747820646174610000000000000000000000000000000000604082015260600190565b60208082526012908201527f6d697373696e6720646570656e64656e63790000000000000000000000000000604082015260600190565b6020808252601b908201527f566f74696e6720706572696f6420697320746f6f2073686f72742e0000000000604082015260600190565b6020808252601c908201527f50656e64696e6720706572696f6420697320746f6f2073686f72742e00000000604082015260600190565b60208082526018908201527f4e6f7420612070726f706f73616c20657865637574696f6e0000000000000000604082015260600190565b60208082526033908201527f54696d656c6f636b436f6e74726f6c6c65723a20756e6465726c79696e67207460408201527f72616e73616374696f6e20726576657274656400000000000000000000000000606082015260800190565b9283526001600160a01b039190911660208301521515604082015260600190565b9283526020830191909152604082015260600190565b968752602087019590955260408601939093526060850191909152608084015260a08301526001600160a01b031660c082015260e00190565b6000808335601e19843603018112612004578283fd5b83018035915067ffffffffffffffff82111561201e578283fd5b60200191503681900382131561144b57600080fd5b6001600160a01b038116811461204857600080fd5b5056fe536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a2646970667358221220f35d087d39c17a44242eb3c5ee46b60d115684536130c12a4c7fc4fbdf05f1cc64736f6c63430007060033";
