//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "../../core/governance/Governed.sol";
import "../../core/work/libraries/CommitMinter.sol";
import "../../core/work/libraries/GrantReceiver.sol";
import "../../core/work/interfaces/IStableReserve.sol";
import "../../core/work/interfaces/IContributionBoard.sol";
import "../../core/dividend/libraries/Distributor.sol";
import "../../core/dividend/interfaces/IDividendPool.sol";
import "../../apps/Workhard.sol";
import "../../utils/IERC1620.sol";
import "../../utils/Utils.sol";

contract ContributionBoard is
    CommitMinter,
    GrantReceiver,
    Distributor,
    Governed,
    ReentrancyGuard,
    Initializable,
    ERC1155Burnable,
    IContributionBoard
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using Utils for address[];

    address public sablier;

    address public commit;

    Workhard public workhard;

    mapping(uint256 => uint256) public projectFund;

    mapping(bytes32 => bool) public claimed;

    mapping(uint256 => uint256) public totalSupplyOf;

    mapping(uint256 => uint256) public maxSupplyOf;

    mapping(uint256 => uint256) public minimumShare;

    mapping(uint256 => bool) public fundingPaused;

    mapping(uint256 => bool) public finalized;

    mapping(uint256 => uint256) private _projectOf;

    mapping(uint256 => uint256[]) private _streams;

    mapping(uint256 => address[]) private _contributors;

    event ManagerUpdated(address indexed manager, bool active);

    event ProjectPosted(uint256 projId);

    event ProjectClosed(uint256 projId);

    event Grant(uint256 projId, uint256 amount);

    event Payed(uint256 projId, address to, uint256 amount);

    event PayedInStream(
        uint256 projId,
        address to,
        uint256 amount,
        uint256 streamId
    );

    event ProjectFunded(uint256 indexed projId, uint256 amount);

    constructor() ERC1155("") {
        // this will not be called
    }

    function initialize(
        address _workhard,
        address _gov,
        address _dividendPool,
        address _stableReserve,
        address _commit,
        address _sablier
    ) public initializer {
        CommitMinter._setup(_stableReserve, _commit);
        Distributor._setup(_dividendPool);
        workhard = Workhard(_workhard);
        sablier = _sablier;
        Governed.initialize(_gov);
        _setURI("");

        // register the supported interfaces to conform to ERC1155 via ERC165
        bytes4 _INTERFACE_ID_ERC165 = 0x01ffc9a7;
        bytes4 _INTERFACE_ID_ERC1155 = 0xd9b67a26;
        bytes4 _INTERFACE_ID_ERC1155_METADATA_URI = 0x0e89341c;
        _registerInterface(_INTERFACE_ID_ERC165);
        _registerInterface(_INTERFACE_ID_ERC1155);
        _registerInterface(_INTERFACE_ID_ERC1155_METADATA_URI);
    }

    modifier onlyStableReserve() {
        require(
            address(stableReserve) == msg.sender,
            "Only the stable reserves can call this function"
        );
        _;
    }

    modifier onlyProjectOwner(uint256 projId) {
        require(workhard.ownerOf(projId) == msg.sender, "Not authorized");
        _;
    }

    function addProjectFund(uint256 projId, uint256 amount) public {
        require(!fundingPaused[projId], "Should unpause funding");
        IERC20(commitToken).safeTransferFrom(msg.sender, address(this), amount);
        uint256 updated = projectFund[projId].add(amount);
        projectFund[projId] = updated;
        if (minimumShare[projId] != 0) {
            // record funding
            _recordContribution(msg.sender, projId, amount);
        }
    }

    function receiveGrant(
        address currency,
        uint256 amount,
        bytes calldata data
    ) external override onlyStableReserve returns (bool result) {
        require(
            currency == commitToken,
            "Only can get $COMMIT token for its grant"
        );
        uint256 projId = abi.decode(data, (uint256));
        require(workhard.ownerOf(projId) != address(0), "No budget owner");
        projectFund[projId] = projectFund[projId].add(amount);
        emit Grant(projId, amount);
        return true;
    }

    function enableFunding(
        uint256 projectId,
        uint256 _minimumShare,
        uint256 _maxContribution
    ) public onlyProjectOwner(projectId) {
        require(0 < _minimumShare, "Should be greater than 0");
        require(_minimumShare < 10000, "Cannot be greater than denominator");
        require(minimumShare[projectId] == 0, "Funding is already enabled.");
        minimumShare[projectId] = _minimumShare;
        _setMaxContribution(projectId, _maxContribution);
    }

    /**
     * @notice Usually the total supply = funded + paid. If you want to raise
     *         10000 COMMITs you should set the max contribution at least 20000.
     */
    function setMaxContribution(uint256 projectId, uint256 maxContribution)
        public
        onlyProjectOwner(projectId)
    {
        _setMaxContribution(projectId, maxContribution);
    }

    function pauseFunding(uint256 projectId)
        public
        onlyProjectOwner(projectId)
    {
        require(!fundingPaused[projectId], "Already paused");
        fundingPaused[projectId] = true;
    }

    function resumeFunding(uint256 projectId)
        public
        onlyProjectOwner(projectId)
    {
        require(fundingPaused[projectId], "Already unpaused");
        fundingPaused[projectId] = false;
    }

    function compensate(
        uint256 projectId,
        address to,
        uint256 amount
    ) public onlyProjectOwner(projectId) {
        require(projectFund[projectId] >= amount, "Not enough fund.");
        projectFund[projectId] = projectFund[projectId] - amount; // "require" protects underflow
        IERC20(commitToken).safeTransfer(to, amount);
        _recordContribution(to, projectId, amount);
        emit Payed(projectId, to, amount);
    }

    function compensateInStream(
        uint256 projectId,
        address to,
        uint256 amount,
        uint256 period
    ) public onlyProjectOwner(projectId) {
        require(projectFund[projectId] >= amount);
        projectFund[projectId] = projectFund[projectId] - amount; // "require" protects underflow
        _recordContribution(to, projectId, amount);
        IERC20(commitToken).approve(sablier, amount); // approve the transfer
        uint256 streamId =
            IERC1620(sablier).createStream(
                to,
                amount,
                commitToken,
                block.timestamp,
                block.timestamp + period
            );

        _projectOf[streamId] = projectId;
        _streams[projectId].push(streamId);
        emit PayedInStream(projectId, to, amount, streamId);
    }

    function cancelStream(uint256 projectId, uint256 streamId)
        public
        onlyProjectOwner(projectId)
    {
        require(projectOf(streamId) == projectId, "Invalid project id");

        (, address recipient, , , , , uint256 remainingBalance, ) =
            IERC1620(sablier).getStream(streamId);

        require(IERC1620(sablier).cancelStream(streamId), "Failed to cancel");
        projectFund[projectId] = projectFund[projectId].add(remainingBalance);
        uint256 cancelContribution =
            Math.min(balanceOf(recipient, projectId), remainingBalance);
        _burn(recipient, projectId, cancelContribution);
    }

    function recordContribution(
        address to,
        uint256 id,
        uint256 amount
    ) external override onlyProjectOwner(id) {
        require(
            minimumShare[id] == 0,
            "Once it starts to get funding, you cannot record additional contribution"
        );
        require(
            _recordContribution(to, id, amount),
            "Cannot record after it's launched."
        );
    }

    function finalize(uint256 id) external override {
        require(
            msg.sender == address(workhard),
            "this should be called only for upgrade"
        );
        require(!finalized[id], "Already finalized");
        finalized[id] = true;
    }

    function projectOf(uint256 streamId) public view returns (uint256 id) {
        return _projectOf[streamId];
    }

    function getStreams(uint256 projId) public view returns (uint256[] memory) {
        return _streams[projId];
    }

    function getContributors(uint256 projId)
        public
        view
        returns (address[] memory)
    {
        return _contributors[projId];
    }

    function uri(uint256 id)
        external
        view
        override(ERC1155, IERC1155MetadataURI)
        returns (string memory)
    {
        return IERC721Metadata(address(workhard)).tokenURI(id);
    }

    function _setMaxContribution(uint256 _id, uint256 _maxContribution)
        internal
    {
        require(!finalized[_id], "DAO is launched. You cannot update it.");
        maxSupplyOf[_id] = _maxContribution;
        emit NewMaxContribution(_id, _maxContribution);
    }

    function _recordContribution(
        address to,
        uint256 id,
        uint256 amount
    ) internal returns (bool) {
        if (finalized[id]) return false;
        (bool exist, ) = _contributors[id].find(to);
        if (!exist) {
            _contributors[id].push(to);
        }
        bytes memory zero;
        _mint(to, id, amount, zero);
        return true;
    }

    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        super._mint(account, id, amount, data);
        totalSupplyOf[id] = totalSupplyOf[id].add(amount);
        require(
            maxSupplyOf[id] == 0 || totalSupplyOf[id] <= maxSupplyOf[id],
            "Exceeds the max supply. Set a new max supply value."
        );
    }

    function _burn(
        address account,
        uint256 id,
        uint256 amount
    ) internal override {
        super._burn(account, id, amount);
        totalSupplyOf[id] = totalSupplyOf[id].sub(amount);
    }

    function _beforeTokenTransfer(
        address,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory,
        bytes memory
    ) internal override {
        if (from == address(0) || to == address(0)) {
            // contribution can be minted or burned before the dao launch
        } else {
            // transfer is only allowed after the finalization
            for (uint256 i = 0; i < ids.length; i++) {
                require(finalized[ids[i]], "Not finalized");
            }
        }
    }
}
