//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "../../core/governance/Governed.sol";
import "../../core/work/libraries/CommitMinter.sol";
import "../../core/work/libraries/GrantReceiver.sol";
import "../../core/work/interfaces/IStableReserve.sol";
import "../../core/work/interfaces/IProject.sol";
import "../../core/dividend/libraries/Distributor.sol";
import "../../core/dividend/interfaces/IDividendPool.sol";
import "../../utils/ExchangeLib.sol";

struct Budget {
    address currency;
    uint256 amount;
    bool transferred;
}

contract JobBoard is
    CommitMinter,
    GrantReceiver,
    Distributor,
    Governed,
    ReentrancyGuard
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    address public immutable baseCurrency;

    IProject public immutable project;

    address public oneInch;

    uint256 public normalTaxRate = 2000; // 20% goes to the vision sharing farm, 80% is swapped to stable coin and goes to the labor market

    uint256 public taxRateForUndeclared = 5000; // 50% goes to the vision farm when the budget is undeclared.

    mapping(address => bool) public acceptableTokens;

    mapping(uint256 => uint256) public projectFund;

    mapping(bytes32 => bool) public claimed;

    mapping(uint256 => Budget[]) public projectBudgets;

    mapping(uint256 => bool) public approvedProjects;

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

    constructor(
        address _gov,
        address _project,
        address _dividendPool,
        address _stableReserve,
        address _baseCurrency,
        address _oneInchExchange
    ) Governed() CommitMinter(_stableReserve) Distributor(_dividendPool) {
        baseCurrency = _baseCurrency;
        oneInch = _oneInchExchange;
        project = IProject(_project);
        acceptableTokens[_baseCurrency] = true;
        Governed.setGovernance(_gov);
    }

    modifier onlyStableReserve() {
        require(
            address(stableReserve) == msg.sender,
            "Only the stable reserves can call this function"
        );
        _;
    }

    modifier onlyProjectOwner(uint256 projId) {
        require(project.ownerOf(projId) == msg.sender, "Not authorized");
        _;
    }

    modifier onlyApprovedProject(uint256 projId) {
        require(approvedProjects[projId], "Not an approved project.");
        _;
    }

    // 3rd party functions
    function createProject(string memory URI) public {
        uint256 projId = project.createTo(URI, msg.sender);
        emit ProjectPosted(projId);
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
        uint256 amount,
        bytes calldata swapData
    ) public onlyProjectOwner(projId) {
        uint256 budgetIdx = _addBudget(projId, token, amount);
        executeBudget(projId, budgetIdx, swapData);
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
    function executeBudget(
        uint256 projId,
        uint256 index,
        bytes calldata swapData
    ) public onlyApprovedProject(projId) {
        address currency = projectBudgets[projId][index].currency;
        if (currency == baseCurrency) {
            _convertStableToCommit(projId, index, normalTaxRate);
        } else {
            _swapAndAllocateFund(projId, index, normalTaxRate, swapData);
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
        require(project.ownerOf(projId) != address(0), "No budget owner");
        projectFund[projId] = projectFund[projId].add(amount);
        emit Grant(projId, amount);
        return true;
    }

    function compensate(
        uint256 projectId,
        address to,
        uint256 amount
    ) public onlyProjectOwner(projectId) {
        require(projectFund[projectId] >= amount);
        projectFund[projectId] = projectFund[projectId] - amount; // "require" protects underflow
        IERC20(commitToken).safeTransfer(to, amount);
        emit Payed(projectId, to, amount);
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
        require(project.ownerOf(projectId) == signer, "Invalid signer");
        require(projectFund[projectId] >= amount);
        projectFund[projectId] = projectFund[projectId] - amount; // "require" protects underflow
        IERC20(commitToken).safeTransfer(to, amount);
        emit Payed(projectId, to, amount);
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

    function setExchange(address _oneInch) public governed {
        oneInch = _oneInch;
    }

    function setTaxRate(uint256 rate) public governed {
        require(rate <= 10000);
        normalTaxRate = rate;
    }

    function setTaxRateForUndeclared(uint256 rate) public governed {
        require(rate <= 10000);
        taxRateForUndeclared = rate;
    }

    function getTotalBudgets(uint256 projId) public view returns (uint256) {
        return projectBudgets[projId].length;
    }

    // Internal functions
    function _addBudget(
        uint256 projId,
        address token,
        uint256 amount
    ) internal returns (uint256) {
        require(acceptableTokens[token], "Not a supported currency");
        Budget memory budget = Budget(token, amount, false);
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
        address projOwner = project.ownerOf(projId);
        for (uint256 i = 0; i < budgets.length; i += 1) {
            Budget storage budget = budgets[i];
            if (!budget.transferred) {
                budget.transferred = true;
                IERC20(budget.currency).transfer(projOwner, budget.amount);
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
        require(
            budget.currency == baseCurrency,
            "use _swapAndAllocateFund instead"
        );
        // Mark the budget as transferred
        budget.transferred = true;
        // take vision tax from the budget
        uint256 visionTax = budget.amount.mul(taxRate).div(10000);
        uint256 fund = budget.amount.sub(visionTax);
        _distribute(budget.currency, visionTax);
        // Mint commit fund
        _mintCommit(fund);
        projectFund[projId] = projectFund[projId].add(fund);
        emit BudgetExecuted(projId, index);
    }

    /**
     * @param projId The hash of the budget to hammer out
     * @param swapData Fetched payload from 1inch API
     */
    function _swapAndAllocateFund(
        uint256 projId,
        uint256 index,
        uint256 taxRate,
        bytes calldata swapData
    ) internal {
        Budget storage budget = projectBudgets[projId][index];
        require(approvedProjects[projId], "Not an approved project.");
        require(budget.transferred == false, "Budget is already transferred.");
        require(
            budget.currency != baseCurrency,
            "use _convertStableToCommit instead"
        );
        // Mark the budget as transferred
        budget.transferred = true;
        // take vision tax from the budget
        uint256 visionTax = budget.amount.mul(taxRate).div(10000);
        uint256 fund = budget.amount.sub(visionTax);
        // Swap and allocate fund
        _swapOn1Inch(budget, fund, swapData);
        _mintCommit(fund);
        projectFund[projId] = projectFund[projId].add(fund);
        emit BudgetExecuted(projId, index);
    }

    function _swapOn1Inch(
        Budget memory budget,
        uint256 fund,
        bytes calldata swapData
    ) internal {
        // Swap to stable coin and transfer them to the commit pool
        (
            uint256 amount,
            address srcToken,
            address dstToken,
            address dstReceiver
        ) = ExchangeLib.decodeOneInchData(swapData);
        require(
            srcToken == budget.currency,
            "Should convert fund to the designatd stable coin"
        );
        require(
            dstToken == baseCurrency,
            "Should convert fund to the designatd stable coin"
        );
        require(amount == fund, "Input amount is not valid");
        require(
            dstReceiver == address(this),
            "Swapped stable coins should go to this contract"
        );
        uint256 prevBal = IERC20(baseCurrency).balanceOf(stableReserve);
        (bool success, bytes memory result) = oneInch.call(swapData);
        require(success, "failed to swap tokens");
        uint256 swappedStables;
        assembly {
            swappedStables := mload(add(result, 0x20))
        }
        require(
            swappedStables ==
                IERC20(baseCurrency).balanceOf(stableReserve).sub(prevBal),
            "Swapped amount is different with the real swapped amount"
        );
    }
}
