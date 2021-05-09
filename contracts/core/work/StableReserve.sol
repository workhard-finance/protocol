//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../../core/work/interfaces/IStableReserve.sol";
import "../../core/work/interfaces/IGrantReceiver.sol";
import "../../core/tokens/COMMIT.sol";
import "../../core/governance/Governed.sol";
import "../../utils/HasInitializer.sol";
import "../../utils/ExchangeLib.sol";
import "../../utils/ERC20Recoverer.sol";

/**
 * @notice StableReserve is the $COMMIT minter. It allows JobBoard to mint $COMMIT token.
 */
contract StableReserve is
    ERC20Recoverer,
    Governed,
    IStableReserve,
    HasInitializer
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Address for address;

    address public override commitmentToken;

    address public immutable override baseCurrency;

    uint256 public priceOfCOMMIT = 20000; // denominator = 10000, ~= $2

    mapping(address => bool) public minters; // allowed crypto job board contracts

    event MinterUpdated(address indexed minter);

    event Redeemed(address to, uint256 amount);

    address private _deployer;

    constructor(
        address _gov,
        address _commitmentToken,
        address _baseCurrency
    ) ERC20Recoverer() Governed() HasInitializer() {
        commitmentToken = _commitmentToken;
        baseCurrency = _baseCurrency;
        ERC20Recoverer.disablePermanently(_baseCurrency);
        ERC20Recoverer.disablePermanently(_commitmentToken);
        ERC20Recoverer.setRecoverer(_gov);
        Governed.setGovernance(_gov);
        _deployer = msg.sender;
    }

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == gov, "Not authorized");
        _;
    }

    function init(address minter) public initializer {
        _setMinter(minter, true);
    }

    function redeem(uint256 amount) public {
        require(
            COMMIT(commitmentToken).balanceOf(msg.sender) >= amount,
            "Not enough balance"
        );
        COMMIT(commitmentToken).burnFrom(msg.sender, amount);
        IERC20(baseCurrency).transfer(msg.sender, amount);
        emit Redeemed(msg.sender, amount);
    }

    function payInsteadOfWorking(uint256 amount) public {
        uint256 amountToPay = amount.mul(priceOfCOMMIT).div(10000);
        IERC20(baseCurrency).safeTransferFrom(
            msg.sender,
            address(this),
            amountToPay
        );
        _mintCOMMIT(msg.sender, amount);
    }

    function reserveAndMint(uint256 amount) public override onlyMinter {
        IERC20(baseCurrency).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        _mintCOMMIT(msg.sender, amount);
    }

    function grant(
        address recipient,
        uint256 amount,
        bytes memory data
    ) public governed {
        _mintCOMMIT(recipient, amount);
        bytes memory returndata =
            address(recipient).functionCall(
                abi.encodeWithSelector(
                    IGrantReceiver(recipient).receiveGrant.selector,
                    commitmentToken,
                    amount,
                    data
                ),
                "GrantReceiver: low-level call failed"
            );
        if (returndata.length > 0) {
            // Return data is optional
            // solhint-disable-next-line max-line-length
            require(
                abi.decode(returndata, (bool)),
                "GrantReceiver: low-level call failed"
            );
        }
    }

    function setMinter(address minter, bool active) public governed {
        _setMinter(minter, active);
    }

    function mintable() public view returns (uint256) {
        uint256 currentSupply = COMMIT(commitmentToken).totalSupply();
        uint256 currentRedeemable =
            IERC20(baseCurrency).balanceOf(address(this));
        return currentRedeemable.sub(currentSupply);
    }

    function _mintCOMMIT(address to, uint256 amount) internal {
        require(amount <= mintable(), "Out of budget");
        COMMIT(commitmentToken).mint(to, amount);
    }

    function _setMinter(address minter, bool active) internal {
        if (minters[minter] != active) {
            emit MinterUpdated(minter);
        }
        minters[minter] = active;
    }
}