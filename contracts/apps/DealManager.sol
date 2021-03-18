//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/ExchangeLib.sol";
import "../interfaces/ILaborMarket.sol";
import "../interfaces/IVisionFarm.sol";
import "../governance/Governed.sol";

struct Deal {
    address contractor;
    address currency;
    uint256 amount;
    bool hammeredOut;
    bool executed;
}

contract DealManager is Governed {
    using SafeMath for uint256;

    address immutable visionFarm;

    address immutable laborMarket;

    address immutable baseCurrency;

    address public oneInch;

    uint256 public normalTaxRate = 2000; // 20% goes to the vision sharing farm, 80% is swapped to stable coin and goes to the labor market

    uint256 public taxRateForUndeclared = 5000; // 50% goes to the vision farm when the deal is undeclared.

    mapping(bytes32 => Deal) public deals;

    mapping(address => bool) public accepted;

    mapping(address => uint256) public taxations;

    mapping(address => uint256) public funds;

    mapping(address => bool) public executors;

    event ExecutorUpdated(address indexed executor, bool active);

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

    modifier onlyExecutor() {
        require(executors[msg.sender], "Not an authorized executor");
        _;
    }

    modifier onlyDealContractor(bytes32 dealHash) {
        require(deals[dealHash].contractor == msg.sender, "Not authorized");
        _;
    }

    // 3rd party functions

    function createDeal(
        string memory detail,
        address token,
        uint256 amount
    ) public {
        bytes32 dealHash = keccak256(abi.encode(detail, token, amount));
        Deal storage deal = deals[dealHash];
        require(deal.contractor == address(0), "Deal already exists");
        require(accepted[token], "Not a supported currency");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        deal.contractor = msg.sender;
        deal.currency = token;
        deal.amount = amount;
    }

    // Owner functions

    function addCurrency(address currency) public governed {
        accepted[currency] = true;
    }

    function removeCurrency(address currency) public governed {
        accepted[currency] = false;
    }

    function setExecutor(address executor, bool active) public governed {
        if (executors[executor] != active) {
            emit ExecutorUpdated(executor, active);
        }
        executors[executor] = active;
    }

    function withdrawDeal(bytes32 dealHash)
        public
        onlyDealContractor(dealHash)
    {
        Deal storage deal = deals[dealHash];
        require(deal.hammeredOut == false, "Deal is already hammered out.");
        IERC20(deal.currency).transferFrom(
            address(this),
            deal.contractor,
            deal.amount
        );
        delete deals[dealHash];
    }

    /**
     * @param dealHash The hash of the deal to hammer out
     */
    function hammerOut(bytes32 dealHash) public governed {
        _hammerOut(dealHash);
    }

    function executeDeal(bytes32 dealHash, bytes calldata swapData)
        public
        onlyExecutor
    {
        if (deals[dealHash].currency == baseCurrency) {
            _executeDeal(dealHash, normalTaxRate);
        } else {
            _swapAndExecuteDeal(dealHash, normalTaxRate, swapData);
        }
    }

    function forceHammerOut(bytes32 dealHash)
        public
        onlyDealContractor(dealHash)
    {
        Deal storage deal = deals[dealHash];
        require(
            deal.currency == baseCurrency,
            "Only accept a base currency contract"
        ); // since on-chain swap can be used for exploitation.
        _hammerOut(dealHash);
        _executeDeal(dealHash, taxRateForUndeclared);
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
        IERC20(currency).approve(visionFarm, amount);
        IVisionFarm(visionFarm).plantSeeds(currency, amount);
    }

    function getDealHash(string memory deal) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(deal));
    }

    /**
     * @param dealHash The hash of the deal to hammer out
     */
    function _hammerOut(bytes32 dealHash) internal {
        Deal storage deal = deals[dealHash];
        require(deal.contractor != address(0), "Deal does not exists.");
        require(deal.hammeredOut == false, "Deal is already hammered out.");
        deal.hammeredOut = true;
    }

    /**
     * @param dealHash The hash of the deal to hammer out.
     * @param taxRate The tax rate to execute the deal.
     */
    function _executeDeal(bytes32 dealHash, uint256 taxRate) internal {
        Deal storage deal = deals[dealHash];
        require(deal.hammeredOut == true, "Deal is not hammered out.");
        require(deal.executed == false, "Deal is already executed.");
        // take vision tax from the deal
        uint256 visionTax = deal.amount.mul(taxRate).div(1 ether);
        uint256 fund = deal.amount.sub(visionTax);
        taxations[deal.currency] = taxations[deal.currency].add(visionTax);
        // Swap to stable coin and transfer them to the commitment pool
        require(
            deal.currency == baseCurrency,
            "use _swapAndExecuteDeal instead"
        );
        bool success = IERC20(baseCurrency).transfer(laborMarket, fund);
        require(success, "failed to transfer tokens");
        // Mark the deal as executed
        _newProjectWithBudget(dealHash, deal.contractor, fund);
        deal.executed = true;
    }

    /**
     * @param dealHash The hash of the deal to hammer out
     * @param swapData Fetched payload from 1inch API
     */
    function _swapAndExecuteDeal(
        bytes32 dealHash,
        uint256 taxRate,
        bytes calldata swapData
    ) internal {
        Deal storage deal = deals[dealHash];
        require(deal.hammeredOut == true, "Deal is not hammered out.");
        require(deal.executed == false, "Deal is already executed.");
        // take vision tax from the deal
        uint256 visionTax = deal.amount.mul(taxRate).div(1 ether);
        uint256 fund = deal.amount.sub(visionTax);
        taxations[deal.currency] = taxations[deal.currency].add(visionTax);
        // Swap to stable coin and transfer them to the commitment pool
        require(deal.currency != baseCurrency, "use _executeDeal instead");
        (
            uint256 amount,
            address srcToken,
            address dstToken,
            address dstReceiver
        ) = ExchangeLib.decodeOneInchData(swapData);
        require(
            srcToken == deal.currency,
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
        // Mark the deal as executed
        _newProjectWithBudget(dealHash, deal.contractor, swappedStables);
        deal.executed = true;
    }

    function _newProjectWithBudget(
        bytes32 dealId,
        address budgetOwner,
        uint256 amount
    ) internal {
        ILaborMarket(laborMarket).createProject(dealId, budgetOwner, amount);
    }
}
