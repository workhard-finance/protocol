//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "../../core/work/interfaces/IStableReserve.sol";
import "../../core/work/interfaces/IGrantReceiver.sol";
import "../../core/tokens/COMMIT.sol";
import "../../core/governance/Governed.sol";
import "../../utils/ERC20Recoverer.sol";

/**
 * @notice StableReserve is the $COMMIT minter. It allows ContributionBoard to mint $COMMIT token.
 */
contract StableReserve is ERC20Recoverer, Governed, IStableReserve {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Address for address;

    address public override commitToken;

    address public override baseCurrency;

    uint256 public priceOfCOMMIT;

    mapping(address => bool) public minters; // allowed crypto job board contracts

    event MinterUpdated(address indexed minter);

    event Redeemed(address to, uint256 amount);

    address private _deployer;

    function initialize(
        address _gov,
        address _commitToken,
        address _baseCurrency,
        address[] memory _minters
    ) public initializer {
        priceOfCOMMIT = 20000; // denominator = 10000, ~= $2
        commitToken = _commitToken;
        baseCurrency = _baseCurrency;

        address[] memory disable = new address[](2);
        disable[0] = _commitToken;
        disable[1] = _baseCurrency;
        ERC20Recoverer.initialize(_gov, disable);
        Governed.initialize(_gov);
        _deployer = msg.sender;
        _setMinter(gov, true);
        for (uint256 i = 0; i < _minters.length; i++) {
            _setMinter(_minters[i], true);
        }
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized");
        _;
    }

    function init(address minter) public initializer {
        _setMinter(minter, true);
    }

    function redeem(uint256 amount) public {
        require(
            COMMIT(commitToken).balanceOf(msg.sender) >= amount,
            "Not enough balance"
        );
        COMMIT(commitToken).burnFrom(msg.sender, amount);
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
                    commitToken,
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
        uint256 currentSupply = COMMIT(commitToken).totalSupply();
        uint256 currentRedeemable =
            IERC20(baseCurrency).balanceOf(address(this));
        return currentRedeemable.sub(currentSupply);
    }

    function _mintCOMMIT(address to, uint256 amount) internal {
        require(amount <= mintable(), "Not enough reserve");
        COMMIT(commitToken).mint(to, amount);
    }

    function _setMinter(address minter, bool active) internal {
        if (minters[minter] != active) {
            emit MinterUpdated(minter);
        }
        minters[minter] = active;
    }
}
