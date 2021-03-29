//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../libraries/ExchangeLib.sol";
import "../interfaces/ILaborMarket.sol";
import "../interfaces/IVisionFarm.sol";
import "../governance/Governed.sol";

struct Budget {
    address currency;
    uint256 amount;
    bool transferred;
}

struct Deal {
    address contractor;
    bool hammeredOut;
    Budget[] budgets;
}

contract DealManager is Governed, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address immutable visionFarm;

    address immutable laborMarket;

    address immutable baseCurrency;

    address public oneInch;

    uint256 public normalTaxRate = 2000; // 20% goes to the vision sharing farm, 80% is swapped to stable coin and goes to the labor market

    uint256 public taxRateForUndeclared = 5000; // 50% goes to the vision farm when the budget is undeclared.

    mapping(bytes32 => Deal) public deals;

    mapping(address => uint256) public taxations;

    mapping(address => uint256) public funds;

    mapping(address => bool) public managers;

    mapping(address => bool) public accepted;

    event ManagerUpdated(address indexed manager, bool active);

    event DealCreated(bytes32 projId, address contractor, string description);

    event DealWithdrawn(bytes32 projId);

    event BudgetAdded(
        bytes32 indexed projId,
        uint256 index,
        address token,
        uint256 amount
    );

    event BudgetApproved(bytes32 projId, uint256 index);

    event BudgetWithdrawn(bytes32 projId, uint256 index);

    constructor(
        address _gov,
        address _visionFarm,
        address _laborMarket,
        address _baseCurrency,
        address _oneInchExchange
    ) Governed() {
        visionFarm = _visionFarm;
        laborMarket = _laborMarket;
        baseCurrency = _baseCurrency;
        oneInch = _oneInchExchange;
        accepted[_baseCurrency] = true;
        Governed.setGovernance(_gov);
    }

    modifier onlyManager() {
        require(managers[msg.sender], "Not an authorized manager");
        _;
    }

    modifier onlyContractor(bytes32 projId) {
        require(deals[projId].contractor == msg.sender, "Not authorized");
        _;
    }

    // 3rd party functions

    function createDeal(string memory description)
        public
        returns (bytes32 projId)
    {
        projId = keccak256(abi.encode(msg.sender, description));
        Deal storage deal = deals[projId];
        require(deal.contractor == address(0), "Budget already exists");
        deal.contractor = msg.sender;
        emit DealCreated(projId, msg.sender, description);
    }

    function createDealWithBudget(
        string memory description,
        address token,
        uint256 amount
    ) public {
        bytes32 projId = createDeal(description);
        _addBudget(projId, token, amount);
    }

    function addBudget(
        bytes32 projId,
        address token,
        uint256 amount
    ) public onlyContractor(projId) {
        _addBudget(projId, token, amount);
    }

    function withdrawDeal(bytes32 projId) public onlyContractor(projId) {
        _withdrawDeal(projId);
    }

    function forceApproveBudget(bytes32 projId, uint256 index)
        public
        onlyContractor(projId)
    {
        // force approve does not allow swap and approve func to prevent
        // exploitation using flash loan attack
        _approveBudget(projId, index, taxRateForUndeclared);
    }

    // Operator functions
    function approveBudget(
        bytes32 projId,
        uint256 index,
        bytes calldata swapData
    ) public onlyManager {
        address currency = deals[projId].budgets[index].currency;
        if (currency == baseCurrency) {
            _approveBudget(projId, index, normalTaxRate);
        } else {
            _swapAndApproveBudget(projId, index, normalTaxRate, swapData);
        }
    }

    // Governed functions

    function addCurrency(address currency) public governed {
        accepted[currency] = true;
    }

    function removeCurrency(address currency) public governed {
        accepted[currency] = false;
    }

    function setManager(address manager, bool active) public governed {
        if (managers[manager] != active) {
            emit ManagerUpdated(manager, active);
        }
        managers[manager] = active;
    }

    function hammerOut(bytes32 projId) public governed {
        _hammerOut(projId);
    }

    function breakDeal(bytes32 projId) public governed {
        _withdrawDeal(projId);
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

    function taxToVisionFarm(address currency, uint256 amount) public governed {
        require(taxations[currency] >= amount);
        taxations[currency] = taxations[currency].sub(amount);
        IERC20(currency).safeApprove(visionFarm, amount);
        IVisionFarm(visionFarm).plantSeeds(currency, amount);
    }

    // Internal functions

    function _addBudget(
        bytes32 projId,
        address token,
        uint256 amount
    ) internal {
        require(accepted[token], "Not a supported currency");
        Deal storage deal = deals[projId];
        Budget memory budget = Budget(token, amount, false);
        deal.budgets.push(budget);
        emit BudgetAdded(projId, deal.budgets.length - 1, token, amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function _hammerOut(bytes32 projId) internal {
        Deal storage deal = deals[projId];
        require(deal.contractor != address(0), "Budget does not exists.");
        require(deal.hammeredOut == false, "Budget is already hammered out.");
        deal.hammeredOut = true;
        ILaborMarket(laborMarket).createProject(projId, deal.contractor);
    }

    function _withdrawDeal(bytes32 projId) internal nonReentrant {
        Deal storage deal = deals[projId];
        require(deal.contractor != address(0), "Budget does not exists.");
        Budget[] storage budgets = deal.budgets;
        for (uint256 i = 0; i < budgets.length; i += 1) {
            Budget storage budget = budgets[i];
            if (!budget.transferred) {
                budget.transferred = true;
                IERC20(budget.currency).transfer(
                    deal.contractor,
                    budget.amount
                );
                emit BudgetWithdrawn(projId, i);
            }
        }
        delete deals[projId].budgets;
        delete deals[projId];
        emit DealWithdrawn(projId);
    }

    /**
     * @param projId The hash of the budget to hammer out.
     * @param taxRate The tax rate to approve the budget.
     */
    function _approveBudget(
        bytes32 projId,
        uint256 index,
        uint256 taxRate
    ) internal {
        Deal storage deal = deals[projId];
        Budget storage budget = deal.budgets[index];
        require(deal.hammeredOut == true, "Deal is not hammered out yet.");
        require(budget.transferred == false, "Budget is already transferred.");
        require(
            budget.currency == baseCurrency,
            "use _swapAndApproveBudget instead"
        );
        // Mark the budget as transferred
        budget.transferred = true;
        // take vision tax from the budget
        uint256 visionTax = budget.amount.mul(taxRate).div(10000);
        uint256 fund = budget.amount.sub(visionTax);
        taxations[budget.currency] = taxations[budget.currency].add(visionTax);
        IERC20(baseCurrency).safeTransfer(laborMarket, fund);
        ILaborMarket(laborMarket).allocateBudget(projId, fund);
        emit BudgetApproved(projId, index);
    }

    /**
     * @param projId The hash of the budget to hammer out
     * @param swapData Fetched payload from 1inch API
     */
    function _swapAndApproveBudget(
        bytes32 projId,
        uint256 index,
        uint256 taxRate,
        bytes calldata swapData
    ) internal {
        Deal storage deal = deals[projId];
        Budget storage budget = deal.budgets[index];
        require(deal.hammeredOut == true, "Budget is not hammered out.");
        require(budget.transferred == false, "Budget is already transferred.");
        require(budget.currency != baseCurrency, "use _approveBudget instead");
        // Mark the budget as transferred
        budget.transferred = true;
        // take vision tax from the budget
        uint256 visionTax = budget.amount.mul(taxRate).div(10000);
        uint256 fund = budget.amount.sub(visionTax);
        taxations[budget.currency] = taxations[budget.currency].add(visionTax);
        _swapOn1Inch(budget, fund, swapData);
        ILaborMarket(laborMarket).allocateBudget(projId, fund);
        emit BudgetApproved(projId, index);
    }

    function _swapOn1Inch(
        Budget memory budget,
        uint256 fund,
        bytes calldata swapData
    ) internal {
        // Swap to stable coin and transfer them to the commitment pool
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
            dstReceiver == laborMarket,
            "Swapped stable coins should go to the labor market"
        );
        uint256 prevBal = IERC20(baseCurrency).balanceOf(laborMarket);
        (bool success, bytes memory result) = oneInch.call(swapData);
        require(success, "failed to swap tokens");
        uint256 swappedStables;
        assembly {
            swappedStables := mload(add(result, 0x20))
        }
        require(
            swappedStables ==
                IERC20(baseCurrency).balanceOf(laborMarket).sub(prevBal),
            "Swapped amount is different with the real swapped amount"
        );
    }
}
