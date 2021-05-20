//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../core/tokens/VISION.sol";
import "../core/tokens/COMMIT.sol";
import "../core/tokens/RIGHT.sol";
import "../core/work/StableReserve.sol";
import "../core/work/JobBoard.sol";
import "../core/marketplace/Marketplace.sol";
import "../core/governance/TimelockedGovernance.sol";
import "../core/governance/FounderShare.sol";
import "../core/governance/WorkersUnion.sol";
import "../core/governance/libraries/VotingEscrowLock.sol";
import "../core/dividend/DividendPool.sol";
import "../core/emission/VisionEmitter.sol";
import "../core/emission/factories/ERC20BurnMiningV1Factory.sol";
import "../core/emission/pools/ERC20BurnMiningV1.sol";

struct WorkhardDAOMetadata {
    string name;
    string symbol;
    string uri;
}

struct WorkhardDAO {
    address multisig;
    address baseCurrency;
    address timelock;
    address vision;
    address commit;
    address right;
    address founderShare;
    address founderSharePool;
    address stableReserve;
    address jobBoard;
    address marketplace;
    address dividendPool;
    address workersUnion;
    address visionEmitter;
    address votingEscrow;
}

struct WorkhardCommonContracts {
    address voteCounter;
    address project;
    address erc20StakeMiningV1Factory;
    address erc20BurnMiningV1Factory;
    address erc721StakeMiningV1Factory;
    address erc1155StakeMiningV1Factory;
}

struct WorkhardForkParams {
    address multisig;
    address baseCurrency;
    // tokens
    string visionName;
    string visionSymbol;
    string commitName;
    string commitSymbol;
    string rightName;
    string rightSymbol;
    // timelock
    uint256 minDelay;
    uint256 launchDelay;
    uint256 initialEmission;
    uint256 minEmissionRatePerWeek;
    uint256 emissionCutRate;
    uint256 founderShare;
}

contract Workhard is ERC721 {
    using Clones for address;

    WorkhardDAO private masterDAO;

    WorkhardCommonContracts private commons;

    mapping(uint256 => WorkhardDAO) private dao;

    mapping(uint256 => WorkhardDAOMetadata) private metadata;

    mapping(uint256 => uint256) public deploymentSteps;

    event DAOLaunched(uint256 id);

    function getCommons() public view returns (WorkhardCommonContracts memory) {
        return commons;
    }

    function getDAO(uint256 id) public view returns (WorkhardDAO memory) {
        return dao[id];
    }

    function getMetadata(uint256 id)
        public
        view
        returns (WorkhardDAOMetadata memory)
    {
        return metadata[id];
    }

    constructor(
        WorkhardDAO memory _masterDAO,
        WorkhardCommonContracts memory _commons
    ) ERC721("WORKHARD DAO", "WORKHARD") {
        masterDAO = _masterDAO;
        commons = _commons;
        address founderSharePool =
            ERC20BurnMiningV1Factory(commons.erc20BurnMiningV1Factory)
                .poolAddress(masterDAO.visionEmitter, masterDAO.founderShare);
        masterDAO.founderSharePool = founderSharePool;
        dao[0] = masterDAO;
    }

    function createDAO(WorkhardDAOMetadata memory _metadata) public {
        uint256 id =
            uint256(keccak256(abi.encodePacked(_metadata.name, _metadata.uri)));
        require(deploymentSteps[id] == 0, "Already created.");
        deploymentSteps[id] = 1;
        _mint(msg.sender, id);
        WorkhardDAOMetadata storage data = metadata[id];
        data.name = _metadata.name;
        data.symbol = _metadata.symbol;
        data.uri = _metadata.uri;
    }

    function launch(uint256 id, WorkhardForkParams memory params) public {
        require(
            ownerOf(id) == msg.sender,
            "Only the creator can call this function"
        );
        _deploy(id);
        _initialize(id, params);
        emit DAOLaunched(id);
    }

    function changeMultisig(uint256 id, address newMultisig) public {
        require(
            msg.sender == dao[id].multisig,
            "Only the prev owner can change this value."
        );
        dao[id].multisig = newMultisig;
    }

    function _deploy(uint256 id) internal {
        require(msg.sender == ownerOf(id));
        require(deploymentSteps[id] == 1, "Already deployed or not created.");
        WorkhardDAO storage fork = dao[id];
        deploymentSteps[id] = 2;
        bytes32 salt = bytes32(id);
        fork.timelock = masterDAO.timelock.cloneDeterministic(salt);
        fork.vision = masterDAO.vision.cloneDeterministic(salt);
        fork.commit = masterDAO.commit.cloneDeterministic(salt);
        fork.right = masterDAO.right.cloneDeterministic(salt);
        fork.founderShare = masterDAO.founderShare.cloneDeterministic(salt);
        fork.stableReserve = masterDAO.stableReserve.cloneDeterministic(salt);
        fork.dividendPool = masterDAO.dividendPool.cloneDeterministic(salt);
        fork.jobBoard = masterDAO.jobBoard.cloneDeterministic(salt);
        fork.marketplace = masterDAO.marketplace.cloneDeterministic(salt);
        fork.workersUnion = masterDAO.workersUnion.cloneDeterministic(salt);
        fork.visionEmitter = masterDAO.visionEmitter.cloneDeterministic(salt);
        fork.votingEscrow = masterDAO.votingEscrow.cloneDeterministic(salt);
        fork.founderSharePool = ERC20BurnMiningV1Factory(
            commons
                .erc20BurnMiningV1Factory
        )
            .poolAddress(fork.visionEmitter, fork.visionEmitter);
    }

    function _initialize(uint256 id, WorkhardForkParams memory params)
        internal
    {
        require(msg.sender == ownerOf(id));
        require(deploymentSteps[id] == 2, "Already launched or not deployed.");
        deploymentSteps[id] = 3;
        WorkhardDAO storage fork = dao[id];
        fork.multisig = params.multisig;
        fork.baseCurrency = params.baseCurrency;
        TimelockedGovernance(payable(fork.timelock)).initialize(
            params.minDelay,
            fork.multisig,
            fork.workersUnion
        );
        VISION(fork.vision).initialize(params.visionName, params.visionSymbol);
        COMMIT(fork.commit).initialize(params.commitName, params.commitSymbol);
        RIGHT(fork.right).initialize(
            params.rightName,
            params.rightSymbol,
            fork.votingEscrow
        );
        FounderShare(fork.founderShare).initialize(
            string(abi.encodePacked(metadata[id].name, " Founder Share")),
            string(
                abi.encodePacked(metadata[id].symbol, "-FounderBurnMiningV1")
            ),
            fork.votingEscrow
        );
        StableReserve(fork.stableReserve).initialize(
            fork.timelock,
            fork.commit,
            fork.baseCurrency
        );
        JobBoard(fork.jobBoard).initialize(
            fork.timelock,
            commons.project,
            fork.dividendPool,
            fork.stableReserve,
            fork.baseCurrency,
            fork.commit
        );
        Marketplace(fork.marketplace).initialize(
            fork.timelock,
            fork.commit,
            fork.dividendPool
        );
        DividendPool(fork.dividendPool).initialize(fork.timelock, fork.right);
        WorkersUnion(payable(fork.workersUnion)).initialize(
            commons.voteCounter,
            fork.timelock,
            params.launchDelay
        );
        VisionEmitter(fork.visionEmitter).initialize(
            params.initialEmission,
            params.minEmissionRatePerWeek,
            params.emissionCutRate,
            params.founderShare,
            fork.founderSharePool,
            fork.timelock,
            fork.timelock,
            fork.vision,
            masterDAO.dividendPool
        );
        VisionEmitter(fork.visionEmitter).newPool(
            ERC20BurnMiningV1(0).erc20BurnMiningV1.selector,
            fork.founderShare
        );
        VotingEscrowLock(fork.votingEscrow).initialize(
            string(abi.encodePacked(metadata[id].name, " Voting Escrow Lock")),
            string(abi.encodePacked(metadata[id].symbol, "-VE-LOCK")),
            metadata[id].uri,
            fork.vision,
            fork.right
        );
    }
}
