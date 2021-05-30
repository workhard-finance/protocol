//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../core/emission/libraries/TokenEmitter.sol";

struct WorkhardDAO {
    address multisig;
    address baseCurrency;
    address timelock;
    address vision;
    address commit;
    address right;
    address stableReserve;
    address contributionBoard;
    address marketplace;
    address dividendPool;
    address voteCounter;
    address workersUnion;
    address visionEmitter;
    address votingEscrow;
}

struct CommonContracts {
    address pool2Factory;
    address weth;
    address erc20StakeMiningV1Factory;
    address erc20BurnMiningV1Factory;
    address erc721StakeMiningV1Factory;
    address erc1155StakeMiningV1Factory;
    address erc1155BurnMiningV1Factory;
    address initialContributorShareFactory;
}

struct CloneParams {
    address multisig;
    address baseCurrency;
    // Project
    string projectName;
    string projectSymbol;
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

interface IWorkhard is IERC721 {
    event DAOLaunched(uint256 id);
    event NewProject(uint256 indexed daoId, uint256 id);
    event ProjectMoved(uint256 indexed from, uint256 indexed to);

    function createProject(uint256 daoId, string memory _uri)
        external
        returns (uint256 id);

    function updateURI(uint256 _tokenId, string memory _uri) external;

    function upgradeToDAO(uint256 _tokenId, CloneParams memory params) external;

    function launch(
        uint256 id,
        uint256 liquidityMiningRate,
        uint256 commitMiningRate,
        uint256 treasury,
        uint256 caller
    ) external;

    function launchHard(uint256 id, MiningConfig memory config) external;

    function immortalize(uint256 _tokenId) external;

    function changeMultisig(uint256 id, address newMultisig) external;

    function changeProjectOwner(uint256 id, address newOwner) external;

    function moveProjectToAnotherDAO(uint256 _tokenId, uint256 _daoId) external;

    /** VIEW FUNCTIONS */

    /**
     * 0 => not created
     * 1 => project
     * 2 => upgrading to dao
     * 3 => dao initialized
     * 4 => dao launched
     */
    function growth(uint256 tokenId) external view returns (uint256);

    function immortalized(uint256 tokenId) external view returns (bool);

    function convertDAOIdToAddress(uint256 id) external view returns (address);

    function convertDAOAddressToId(address daoAddress)
        external
        view
        returns (uint256);

    function daoOf(uint256 projId) external view returns (uint256 daoId);

    function projectsOf(uint256 daoId) external view returns (uint256 len);

    function projectsOfDAOByIndex(uint256 daoId, uint256 index)
        external
        view
        returns (uint256 projId);

    function getMasterDAO() external view returns (WorkhardDAO memory);

    function getCommons() external view returns (CommonContracts memory);

    function getDAO(uint256 id) external view returns (WorkhardDAO memory);

    function getAllDAOs() external view returns (uint256[] memory);

    function getController() external view returns (WorkhardDAO memory);

    function nameOf(uint256 daoId) external view returns (string memory);

    function symbolOf(uint256 daoId) external view returns (string memory);
}
