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
import "../../core/governance/Governed.sol";
import "../../core/work/libraries/CommitMinter.sol";
import "../../core/work/libraries/GrantReceiver.sol";
import "../../core/work/interfaces/IStableReserve.sol";
import "../../core/work/interfaces/IContributionBoard.sol";
import "../../core/dividend/libraries/Distributor.sol";
import "../../core/dividend/interfaces/IDividendPool.sol";
import "../../apps/IWorkhard.sol";

struct Budget {
    uint256 amount;
    bool transferred;
}

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

    bool thirdPartyAccess;

    address public baseCurrency;

    IWorkhard public workhard;

    uint256 public normalTaxRate = 2000; // 20% goes to the vision sharing farm, 80% is swapped to stable coin and goes to the labor market

    uint256 public taxRateForUndeclared = 5000; // 50% goes to the vision farm when the budget is undeclared.

    mapping(address => bool) public acceptableTokens;

    mapping(uint256 => uint256) public projectFund;

    mapping(bytes32 => bool) public claimed;

    mapping(uint256 => Budget[]) public projectBudgets;

    mapping(uint256 => bool) public approvedProjects;

    mapping(uint256 => bool) public frozen;

    event ManagerUpdated(address indexed manager, bool active);

    event ProjectPosted(uint256 projId);

    event ProjectClosed(uint256 projId);

    event Grant(uint256 projId, uint256 amount);

    event Payed(uint256 projId, address to, uint256 amount);

    event BudgetAdded(
        uint256 indexed projId,
        uint256 index,
        address token,
        uint256 amount
    );

    event BudgetExecuted(uint256 projId, uint256 index);

    event BudgetWithdrawn(uint256 projId, uint256 index);

    constructor() ERC1155("") {
        // this will not be called
    }

    function initialize(
        address _workhard,
        address _gov,
        address _dividendPool,
        address _stableReserve,
        address _baseCurrency,
        address _commit
    ) public initializer {
        normalTaxRate = 2000; // 20% goes to the vision sharing farm, 80% is swapped to stable coin and goes to the labor market
        taxRateForUndeclared = 5000; // 50% goes to the vision farm when the budget is undeclared.
        CommitMinter._setup(_stableReserve, _commit);
        Distributor._setup(_dividendPool);
        baseCurrency = _baseCurrency;
        workhard = IWorkhard(_workhard);
        acceptableTokens[_baseCurrency] = true;
        thirdPartyAccess = true;
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

    modifier onlyApprovedProject(uint256 projId) {
        require(thirdPartyAccess, "Third party access is not allowed.");
        require(approvedProjects[projId], "Not an approved project.");
        _;
    }

    function addBudget(
        uint256 projId,
        address token,
        uint256 amount
    ) public onlyProjectOwner(projId) {
        _addBudget(projId, token, amount);
    }

    function addAndExecuteBudget(
        uint256 projId,
        address token,
        uint256 amount
    ) public onlyProjectOwner(projId) {
        uint256 budgetIdx = _addBudget(projId, token, amount);
        executeBudget(projId, budgetIdx);
    }

    function closeProject(uint256 projId) public onlyProjectOwner(projId) {
        _withdrawAllBudgets(projId);
        approvedProjects[projId] = false;
        emit ProjectClosed(projId);
    }

    function forceExecuteBudget(uint256 projId, uint256 index)
        public
        onlyProjectOwner(projId)
    {
        // force approve does not allow swap and approve func to prevent
        // exploitation using flash loan attack
        _convertStableToCommit(projId, index, taxRateForUndeclared);
    }

    // Operator functions
    function executeBudget(uint256 projId, uint256 index)
        public
        onlyApprovedProject(projId)
    {
        _convertStableToCommit(projId, index, normalTaxRate);
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

    function compensate(
        uint256 projectId,
        address to,
        uint256 amount
    ) public onlyProjectOwner(projectId) {
        _compensate(projectId, to, amount);
    }

    function claim(
        uint256 projectId,
        address to,
        uint256 amount,
        bytes32 salt,
        bytes memory sig
    ) public {
        bytes32 claimHash =
            keccak256(abi.encodePacked(projectId, to, amount, salt));
        require(!claimed[claimHash], "Already claimed");
        claimed[claimHash] = true;
        address signer = claimHash.recover(sig);
        require(workhard.ownerOf(projectId) == signer, "Invalid signer");
        _compensate(projectId, to, amount);
    }

    function recordContribution(
        address to,
        uint256 id,
        uint256 amount
    ) external override onlyProjectOwner(id) returns (bool) {
        if (frozen[id]) return false;
        _recordContribution(to, id, amount);
        return true;
    }

    function freeze(uint256 id) external override {
        require(
            msg.sender == address(workhard),
            "this should be called only for upgrade"
        );
        require(!frozen[id], "Already frozen");
        frozen[id] = true;
    }

    // Governed functions

    function addCurrency(address currency) public governed {
        acceptableTokens[currency] = true;
    }

    function removeCurrency(address currency) public governed {
        acceptableTokens[currency] = false;
    }

    function approveProject(uint256 projId) public governed {
        _approveProject(projId);
    }

    function disapproveProject(uint256 projId) public governed {
        _withdrawAllBudgets(projId);
        approvedProjects[projId] = false;
        emit ProjectClosed(projId);
    }

    function setTaxRate(uint256 rate) public governed {
        require(rate <= 10000);
        normalTaxRate = rate;
    }

    function setTaxRateForUndeclared(uint256 rate) public governed {
        require(rate <= 10000);
        taxRateForUndeclared = rate;
    }

    function allowThirdPartyAccess(bool allow) public governed {
        thirdPartyAccess = allow;
    }

    function getTotalBudgets(uint256 projId) public view returns (uint256) {
        return projectBudgets[projId].length;
    }

    function uri(uint256 id)
        external
        view
        override(ERC1155, IERC1155MetadataURI)
        returns (string memory)
    {
        return IERC721Metadata(address(workhard)).tokenURI(id);
    }

    // Internal functions
    function _addBudget(
        uint256 projId,
        address token,
        uint256 amount
    ) internal returns (uint256) {
        require(acceptableTokens[token], "Not a supported currency");
        Budget memory budget = Budget(amount, false);
        projectBudgets[projId].push(budget);
        emit BudgetAdded(
            projId,
            projectBudgets[projId].length - 1,
            token,
            amount
        );
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        return projectBudgets[projId].length - 1;
    }

    function _approveProject(uint256 projId) internal {
        require(!approvedProjects[projId], "Already approved");
        approvedProjects[projId] = true;
    }

    function _withdrawAllBudgets(uint256 projId) internal nonReentrant {
        Budget[] storage budgets = projectBudgets[projId];
        address projOwner = workhard.ownerOf(projId);
        for (uint256 i = 0; i < budgets.length; i += 1) {
            Budget storage budget = budgets[i];
            if (!budget.transferred) {
                budget.transferred = true;
                IERC20(baseCurrency).transfer(projOwner, budget.amount);
                emit BudgetWithdrawn(projId, i);
            }
        }
        delete projectBudgets[projId];
    }

    /**
     * @param projId The project NFT id for this budget.
     * @param taxRate The tax rate to approve the budget.
     */
    function _convertStableToCommit(
        uint256 projId,
        uint256 index,
        uint256 taxRate
    ) internal {
        Budget storage budget = projectBudgets[projId][index];
        require(budget.transferred == false, "Budget is already transferred.");
        // Mark the budget as transferred
        budget.transferred = true;
        // take vision tax from the budget
        uint256 visionTax = budget.amount.mul(taxRate).div(10000);
        uint256 fund = budget.amount.sub(visionTax);
        _distribute(baseCurrency, visionTax);
        // Mint commit fund
        _mintCommit(fund);
        projectFund[projId] = projectFund[projId].add(fund);
        emit BudgetExecuted(projId, index);
    }

    function _compensate(
        uint256 projectId,
        address to,
        uint256 amount
    ) internal {
        require(projectFund[projectId] >= amount);
        projectFund[projectId] = projectFund[projectId] - amount; // "require" protects underflow
        IERC20(commitToken).safeTransfer(to, amount);
        _recordContribution(to, projectId, amount);
        emit Payed(projectId, to, amount);
    }

    function _recordContribution(
        address to,
        uint256 id,
        uint256 amount
    ) internal {
        bytes memory zero;
        _mint(to, id, amount, zero);
    }
}
