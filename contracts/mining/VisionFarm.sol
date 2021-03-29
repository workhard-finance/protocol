//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/Utils.sol";
import "../libraries/HasInitializer.sol";
import "../governance/Governed.sol";

struct Farm {
    uint256 totalFarmers;
    address[] tokens;
    mapping(address => uint256) crops;
    mapping(address => uint256) dispatchedFarmers;
}

struct Staking {
    uint256 amount; // amount of staked vision token
    uint256 locked; // in epoch unit
}

/** @title Vision Farm */
contract VisionFarm is Governed, HasInitializer {
    using SafeMath for uint256;
    using Utils for address[];

    address public immutable visionToken;

    mapping(address => bool) planters;

    /** @notice The block timestamp when the contract is deployed */
    uint256 public immutable genesis;

    uint256 public immutable epochUnit = 4 weeks; // default 1 epoch is 4 weeks

    /**
     * @notice The minimum lock period in epoch unit (4 weeks).
     * @dev 1 epoch = 200 weeks ~= 3.8 years
     */
    uint256 public immutable minimumLock = 1; // 1 epoch = 4 weeks ~= 1 month

    /**
     * @notice The maximum lock period in epoch unit (4 weeks).
     * @dev 50 epochs = 200 weeks ~= 3.8 years
     */
    uint256 public immutable maximumLock = 50;

    /**
     * @notice Farm for each epoch. Note that Epoch 0 does not have a farm.
     */
    mapping(uint256 => Farm) public farms;

    /**
     * @notice Stakers can dispatch farmers by the amount of locked tokens and its remaining locking period.
     */
    mapping(address => Staking) public stakings;

    address private _initalizer;

    constructor(address _gov, address _visionToken)
        Governed()
        HasInitializer()
    {
        visionToken = _visionToken;
        genesis = block.timestamp;
        Governed.setGovernance(_gov);
    }

    modifier plantersOnly {
        require(planters[msg.sender], "Not a registered planter");
        _;
    }

    function init(address dealManager, address productMarket)
        public
        initializer
    {
        _addPlanter(dealManager);
        _addPlanter(productMarket);
    }

    function addPlanter(address planter) public governed {
        _addPlanter(planter);
    }

    function removePlanter(address planter) public governed {
        require(planters[planter], "Not a registered planter");
        planters[planter] = false;
    }

    /**
     * @notice It plants seeds to the next epoch's farm. Vision Tax pool is the main
     *      planter and there can be other permissioned planters. Since  planting a
     *      number of different tokens can cause a DOS attack by increaing the gas
     *      cost of harvest() call, only permitted planters can call this function.
     */
    function plantSeeds(address token, uint256 amount) public plantersOnly {
        require(
            IERC20(token).balanceOf(msg.sender) >= amount,
            "Not enough token balance."
        );
        Farm storage farm = farms[getNextEpoch()];
        (bool exist, ) = farm.tokens.find(token); // Utils.sol#5L
        if (!exist) {
            farm.tokens.push(token);
        }
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        farm.crops[token] = farm.crops[token].add(amount);
    }

    /**
     * @notice Stakers can stake VisionTokens to lock them.
     * @param amount The amount of VisionTokens to stake. Once there exists staking from this account,
     *    it automatically adds the value to the existing staking. And also if the existing staking is locked,
     *    newly staked tokens will have the same locked epoch.
     */
    function stake(uint256 amount) public {
        Staking storage staking = stakings[msg.sender];
        IERC20(visionToken).transferFrom(msg.sender, address(this), amount);
        staking.amount = staking.amount.add(amount);
    }

    /**
     * @notice Stakers can lock the staked VisionTokens and dispatch farmers to the farms.
     * @param epochs The number of epochs to lock the existing staking from now. It should be larger than
     *    the minimum epoch. Or, if any locking exists, it should extend its locking peroid.
     *    Once the tokens are locked
     */
    function lock(uint256 epochs) public {
        require(
            epochs >= minimumLock,
            "Should be greater or equal than the minimum lock period"
        );
        require(
            epochs <= maximumLock,
            "Should be less or equal than the maximum lock period"
        );
        uint256 locked = getCurrentEpoch() + epochs; // epoch cannot overflow. No safemath to save gas.
        Staking storage staking = stakings[msg.sender];
        require(locked > staking.locked, "It only allows extending the lock.");
        staking.locked = locked;
    }

    /**
     * @notice Stakers can unstake and withdraw the tokens after the `locked` epoch of the staking.
     * @param amount The amount of VisionTokens to unstake and withdraw.
     */
    function unstake(uint256 amount) public {
        Staking storage staking = stakings[msg.sender];
        require(staking.locked < getCurrentEpoch(), "Staking is locked");
        require(staking.amount >= amount, "Not enough balance");
        staking.amount = staking.amount.sub(amount);
        IERC20(visionToken).transfer(msg.sender, amount);
    }

    /**
     * @notice Users can stake VisionTokens and lock them in one transaction.
     * @param amount The amount of VisionTokens to stake.
     * @param epochs The number of epochs to lock from now.
     */
    function stakeAndLock(uint256 amount, uint256 epochs) public {
        stake(amount);
        lock(epochs);
    }

    /**
     * @notice Stakers can dispatch farmers to the given epoch's farm to get shares.
     *      number of dispatched farmers will be updated if this function is called
     *      after updating the staking information. This will be reverted when it
     *      tries to dispatch farmers to the past epochs.
     */
    function dispatchFarmers(uint256 epoch) public {
        require(
            epoch > getCurrentEpoch(),
            "Cannot dispatch farmers to the past"
        );
        uint256 dispatchable = dispatchableFarmers(msg.sender, epoch);
        uint256 dispatched = dispatchedFarmers(msg.sender, epoch);
        require(
            dispatchable >= dispatched,
            "Cannot withdraw already dispatched farmers"
        );
        uint256 increments = dispatchable - dispatched; // not using safe math to save gas
        Farm storage farm = farms[epoch];
        farm.totalFarmers = farm.totalFarmers.add(increments);
        farm.dispatchedFarmers[msg.sender] = dispatchable;
    }

    function harvest(uint256 epoch) public {
        require(isHarvestable(epoch), "Unripe yet");
        Farm storage farm = farms[epoch];
        (address[] memory tokens, uint256[] memory amounts) =
            getHarvestableCropsFor(epoch, msg.sender);
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 amount = amounts[i];
            farm.crops[token] = farm.crops[token].sub(amount);
            IERC20(token).transfer(msg.sender, amount);
        }
        farm.totalFarmers = farm.totalFarmers.sub(
            farm.dispatchedFarmers[msg.sender]
        ); // update total farmers
        farm.dispatchedFarmers[msg.sender] = 0; // withdraw dispatched farmers
    }

    function harvestAndDispatchToNewFarm() public {
        uint256 currentEpoch = getCurrentEpoch();
        harvest(currentEpoch);
        dispatchFarmers(currentEpoch + 1);
    }

    function batchDispatch() public {
        uint256 remaining = remainingLocks(msg.sender);
        uint256 currentEpoch = getCurrentEpoch();
        for (uint256 i = 0; i < remaining; i++) {
            dispatchFarmers(currentEpoch + 1 + i);
        }
    }

    function isHarvestable(uint256 epoch) public view returns (bool) {
        return epoch <= getCurrentEpoch();
    }

    function remainingLocks(address staker) public view returns (uint256) {
        uint256 epoch = getCurrentEpoch();
        Staking storage staking = stakings[staker];
        uint256 locked;
        if (staking.locked < epoch) {
            locked = 0;
        } else {
            locked = staking.locked + 1 - epoch; // not using safe math to save gas
        }
        return locked;
    }

    /**
     * @notice The number of dispatchable farmers is proportional to the multiplication of
     *    the amount of staked tokens and its remaining locking period.
     */
    function dispatchableFarmers(address staker, uint256 epoch)
        public
        view
        returns (uint256)
    {
        Staking storage staking = stakings[staker];
        uint256 lockedPeriod;
        if (staking.locked < epoch) {
            lockedPeriod = 0;
        } else {
            lockedPeriod = staking.locked + 1 - epoch; // not using safe math to save gas
        }
        return staking.amount.mul(lockedPeriod);
    }

    /**
     * @notice The number of dispatched farmers.
     */
    function dispatchedFarmers(address staker, uint256 epoch)
        public
        view
        returns (uint256)
    {
        Farm storage farm = farms[epoch];
        return farm.dispatchedFarmers[staker];
    }

    function getHarvestableCrops(uint256 epoch)
        public
        view
        returns (address[] memory tokens, uint256[] memory amounts)
    {
        Farm storage farm = farms[epoch];
        tokens = farm.tokens;
        amounts = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            amounts[i] = farm.crops[token];
        }
        return (tokens, amounts);
    }

    function getHarvestableCropsFor(uint256 epoch, address staker)
        public
        view
        returns (address[] memory tokens, uint256[] memory amounts)
    {
        Farm storage farm = farms[epoch];
        tokens = farm.tokens;
        amounts = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            amounts[i] = farm.crops[token]
                .mul(farm.dispatchedFarmers[staker])
                .div(farm.totalFarmers);
        }
        return (tokens, amounts);
    }

    /** @notice default 1 epoch is 4 weeks */
    function getCurrentEpoch() public view returns (uint256) {
        return (block.timestamp - genesis) / epochUnit;
    }

    function getNextEpoch() public view returns (uint256) {
        return getCurrentEpoch() + 1;
    }

    function _addPlanter(address planter) internal {
        require(!planters[planter], "Already registered");
        planters[planter] = true;
    }
}
