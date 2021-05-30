//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "../core/tokens/VISION.sol";
import "../core/tokens/COMMIT.sol";
import "../core/tokens/RIGHT.sol";
import "../core/work/StableReserve.sol";
import "../core/work/ContributionBoard.sol";
import "../core/work/interfaces/IContributionBoard.sol";
import "../core/governance/TimelockedGovernance.sol";
import "../core/governance/WorkersUnion.sol";
import "../core/governance/libraries/VoteCounter.sol";
import "../core/governance/libraries/VotingEscrowLock.sol";
import "../core/dividend/DividendPool.sol";
import "../core/emission/VisionEmitter.sol";
import "../core/emission/factories/ERC20BurnMiningV1Factory.sol";
import "../core/emission/libraries/PoolType.sol";
import "../core/marketplace/Marketplace.sol";
import "../apps/IWorkhard.sol";

contract Workhard is IWorkhard, ERC721, ERC20Recoverer {
    using Clones for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    mapping(uint256 => uint256) public override growth;
    CommonContracts private commons;
    WorkhardDAO private controller;
    mapping(uint256 => WorkhardDAO) private dao;
    mapping(uint256 => string) public override nameOf;
    mapping(uint256 => string) public override symbolOf;
    uint256[] private allDAOs;

    mapping(address => uint256) private _daoAddressBook;
    mapping(uint256 => bool) public override immortalized;

    // Mapping from holder address to their (enumerable) set of owned tokens
    mapping(address => EnumerableSet.UintSet) private _daoProjects; // timelock will be the pointing contract
    EnumerableMap.UintToAddressMap private _belongsTo;

    uint256 private projNum;

    constructor(WorkhardDAO memory _controller, CommonContracts memory _commons)
        ERC721("WORKHARD DAO", "WORKHARD")
    {
        _setBaseURI("ipfs://");
        controller = _controller;
        commons = _commons;
        uint256 masterDAOId = 0;
        address masterTimelock =
            Clones.predictDeterministicAddress(
                controller.timelock,
                bytes32(masterDAOId),
                address(this)
            );
        createProject(
            masterDAOId,
            "QmTFKqcLx9utcxSDLbfWicLnUDFACbrGjcQ6Yhz13qWDqS"
        );
        ERC20Recoverer.initialize(masterTimelock, new address[](0));
    }

    modifier onlyOwnerOf(uint256 id) {
        require(msg.sender == ownerOf(id), "Not the project owner");
        _;
    }

    /**
     * Creating a project for another forked DAO.
     */
    function createProject(uint256 daoId, string memory _uri)
        public
        override
        returns (uint256 id)
    {
        id = projNum;
        projNum++;
        require(growth[id] < 1, "Already created.");
        growth[id] = 1;
        _mint(msg.sender, id);
        _setTokenURI(id, _uri);
        address daoAddress = convertDAOIdToAddress(daoId);
        _daoProjects[daoAddress].add(id);
        _belongsTo.set(id, daoAddress);
        emit NewProject(daoId, id);
        return id;
    }

    function upgradeToDAO(uint256 _tokenId, CloneParams memory params)
        public
        override
        onlyOwnerOf(_tokenId)
    {
        require(dao[_tokenId].vision == address(0), "Already upgraded.");
        _deploy(_tokenId);
        _initialize(_tokenId, params);
        _daoAddressBook[convertDAOIdToAddress(_tokenId)] = _tokenId;
        // Now it does not belong to any dao. A new dao!
        _daoProjects[
            _belongsTo.get(_tokenId, "owner query for nonexistent token")
        ]
            .remove(_tokenId);
        _belongsTo.remove(_tokenId);
        nameOf[_tokenId] = params.projectName;
        symbolOf[_tokenId] = params.projectSymbol;
        emit DAOLaunched(_tokenId);
        allDAOs.push(_tokenId);
    }

    function launch(
        uint256 id,
        uint256 liquidityMiningRate,
        uint256 commitMiningRate,
        uint256 treasury,
        uint256 caller
    ) public override onlyOwnerOf(id) {
        // 1. deploy sushi LP
        WorkhardDAO storage fork = dao[id];
        address lp =
            IUniswapV2Factory(commons.pool2Factory).getPair(
                fork.vision,
                commons.weth
            );
        if (lp == address(0)) {
            IUniswapV2Factory(commons.pool2Factory).createPair(
                fork.vision,
                commons.weth
            );
            lp = IUniswapV2Factory(commons.pool2Factory).getPair(
                fork.vision,
                commons.weth
            );
        }
        MiningConfig memory miningConfig;
        miningConfig.pools = new MiningPoolConfig[](2);
        miningConfig.pools[0] = MiningPoolConfig(
            liquidityMiningRate,
            PoolType.ERC20StakeMiningV1,
            lp
        );
        miningConfig.pools[1] = MiningPoolConfig(
            commitMiningRate,
            PoolType.ERC20BurnMiningV1,
            fork.commit
        );
        miningConfig.treasuryWeight = treasury;
        miningConfig.callerWeight = caller;
        _launch(id, miningConfig);

        // no more initial contribution record
        address initialContributorPool =
            VisionEmitter(fork.visionEmitter).initialContributorPool();
        IContributionBoard(IMiningPool(initialContributorPool).baseToken())
            .freeze(id);
    }

    function launchHard(uint256 id, MiningConfig memory config)
        public
        override
        onlyOwnerOf(id)
    {
        _launch(id, config);
    }

    function immortalize(uint256 _tokenId)
        public
        override
        onlyOwnerOf(_tokenId)
    {
        immortalized[_tokenId] = true;
    }

    function updateURI(uint256 _tokenId, string memory _uri)
        public
        override
        onlyOwnerOf(_tokenId)
    {
        require(!immortalized[_tokenId], "This project is immortalized.");
        _setTokenURI(_tokenId, _uri);
    }

    function changeMultisig(uint256 id, address newMultisig) public override {
        require(
            msg.sender == dao[id].multisig,
            "Only the prev owner can change this value."
        );
        dao[id].multisig = newMultisig;
    }

    /**
     * @notice it returns timelock governance contract's address.
     */
    function convertDAOIdToAddress(uint256 id)
        public
        view
        override
        returns (address)
    {
        return
            Clones.predictDeterministicAddress(
                controller.timelock,
                bytes32(id),
                address(this)
            );
    }

    /**
     * @notice it can return only launched DAO's token id.
     */
    function convertDAOAddressToId(address daoAddress)
        public
        view
        override
        returns (uint256 daoId)
    {
        return _daoAddressBook[daoAddress];
    }

    function daoOf(uint256 projId)
        public
        view
        override
        returns (uint256 daoId)
    {
        address daoAddress =
            _belongsTo.get(projId, "owner query for nonexistent token");
        return convertDAOAddressToId(daoAddress);
    }

    function projectsOf(uint256 daoId)
        public
        view
        override
        returns (uint256 len)
    {
        return _daoProjects[convertDAOIdToAddress(daoId)].length();
    }

    function projectsOfDAOByIndex(uint256 daoId, uint256 index)
        public
        view
        override
        returns (uint256 projId)
    {
        return _daoProjects[convertDAOIdToAddress(daoId)].at(index);
    }

    function getMasterDAO() public view override returns (WorkhardDAO memory) {
        return dao[0];
    }

    function getCommons()
        public
        view
        override
        returns (CommonContracts memory)
    {
        return commons;
    }

    function getDAO(uint256 id)
        public
        view
        override
        returns (WorkhardDAO memory)
    {
        return dao[id];
    }

    function getAllDAOs() public view override returns (uint256[] memory) {
        return allDAOs;
    }

    function getController() public view override returns (WorkhardDAO memory) {
        return controller;
    }

    function _deploy(uint256 id) internal {
        require(msg.sender == ownerOf(id));
        require(growth[id] < 2, "Already deployed.");
        require(growth[id] > 0, "Project does not exists.");
        growth[id] = 2;
        WorkhardDAO storage fork = dao[id];
        bytes32 salt = bytes32(id);
        fork.timelock = controller.timelock.cloneDeterministic(salt);
        fork.vision = controller.vision.cloneDeterministic(salt);
        fork.commit = controller.commit.cloneDeterministic(salt);
        fork.right = controller.right.cloneDeterministic(salt);
        fork.stableReserve = controller.stableReserve.cloneDeterministic(salt);
        fork.dividendPool = controller.dividendPool.cloneDeterministic(salt);
        fork.voteCounter = controller.voteCounter.cloneDeterministic(salt);
        fork.contributionBoard = controller
            .contributionBoard
            .cloneDeterministic(salt);
        fork.marketplace = controller.marketplace.cloneDeterministic(salt);
        fork.workersUnion = controller.workersUnion.cloneDeterministic(salt);
        fork.visionEmitter = controller.visionEmitter.cloneDeterministic(salt);
        fork.votingEscrow = controller.votingEscrow.cloneDeterministic(salt);
    }

    function _initialize(uint256 id, CloneParams memory params) internal {
        require(msg.sender == ownerOf(id));

        require(growth[id] < 3, "Already initialized.");
        require(growth[id] > 1, "Contracts are not deployed.");
        growth[id] = 3;
        WorkhardDAO storage fork = dao[id];
        fork.multisig = params.multisig;
        fork.baseCurrency = params.baseCurrency;

        WorkhardDAO storage parentDAO =
            dao[
                convertDAOAddressToId(
                    _belongsTo.get(id, "owner query for nonexistent token")
                )
            ];
        // dao[belongsTo].contributionBoard;
        TimelockedGovernance(payable(fork.timelock)).initialize(
            params.minDelay,
            fork.multisig,
            fork.workersUnion
        );
        VISION(fork.vision).initialize(
            params.visionName,
            params.visionSymbol,
            fork.visionEmitter
        );
        COMMIT(fork.commit).initialize(
            params.commitName,
            params.commitSymbol,
            fork.stableReserve
        );
        RIGHT(fork.right).initialize(
            params.rightName,
            params.rightSymbol,
            fork.votingEscrow
        );
        address[] memory stableReserveMinters = new address[](1);
        stableReserveMinters[0] = fork.contributionBoard;
        StableReserve(fork.stableReserve).initialize(
            fork.timelock,
            fork.commit,
            fork.baseCurrency,
            stableReserveMinters
        );
        ContributionBoard(fork.contributionBoard).initialize(
            address(this),
            fork.timelock,
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
        address[] memory _rewardTokens = new address[](2);
        _rewardTokens[0] = fork.commit;
        _rewardTokens[1] = fork.baseCurrency;
        DividendPool(fork.dividendPool).initialize(
            fork.timelock,
            fork.right,
            _rewardTokens
        );
        VoteCounter(fork.voteCounter).initialize(fork.right);
        WorkersUnion(payable(fork.workersUnion)).initialize(
            fork.voteCounter,
            fork.timelock,
            params.launchDelay
        );
        VisionEmitter(fork.visionEmitter).initialize(
            EmitterConfig(
                id,
                params.initialEmission,
                params.minEmissionRatePerWeek,
                params.emissionCutRate,
                params.founderShare,
                fork.timelock, // treasury
                address(this), // gov => will be transfered to timelock
                fork.vision,
                id != 0 ? getMasterDAO().dividendPool : address(0),
                parentDAO.contributionBoard,
                commons.erc20BurnMiningV1Factory,
                commons.erc20StakeMiningV1Factory,
                commons.erc721StakeMiningV1Factory,
                commons.erc1155StakeMiningV1Factory,
                commons.erc1155BurnMiningV1Factory,
                commons.initialContributorShareFactory
            )
        );
        VotingEscrowLock(fork.votingEscrow).initialize(
            string(abi.encodePacked(params.projectName, " Voting Escrow Lock")),
            string(abi.encodePacked(params.projectSymbol, "-VE-LOCK")),
            fork.vision,
            fork.right,
            fork.timelock
        );
    }

    function _launch(uint256 id, MiningConfig memory config) internal {
        require(growth[id] < 4, "Already launched.");
        require(growth[id] > 2, "Not initialized.");
        growth[id] = 4;

        WorkhardDAO storage fork = dao[id];
        // 1. set emission
        VisionEmitter(fork.visionEmitter).setEmission(config);
        // 2. start emission
        VisionEmitter(fork.visionEmitter).start();
        // 3. transfer governance
        VisionEmitter(fork.visionEmitter).setGovernance(fork.timelock);
        // 4. transfer ownership to timelock
        _transfer(msg.sender, fork.timelock, id);
    }
}
