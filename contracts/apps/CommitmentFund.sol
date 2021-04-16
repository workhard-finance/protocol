//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "../libraries/HasInitializer.sol";
import "../libraries/ExchangeLib.sol";
import "../libraries/ERC20Recoverer.sol";
import "../interfaces/ICommitmentFund.sol";
import "../interfaces/IProject.sol";
import "../tokens/CommitmentToken.sol";
import "../governance/Governed.sol";

/**
 * @notice CommitmentFund is the $COMMITMENT token minter. It allows CryptoJobBoard to mint $COMMITMENT token.
 */
contract CommitmentFund is
    ERC20Recoverer,
    Governed,
    ICommitmentFund,
    HasInitializer
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    CommitmentToken immutable commitmentToken;

    IERC20 immutable baseCurrency;

    IERC721 immutable project;

    uint256 public priceOfCommitmentToken = 20000; // denominator = 10000, ~= $2

    mapping(address => bool) public cryptoJobBoards; // allowed crypto job board contracts

    mapping(uint256 => uint256) public projectFund;

    mapping(bytes32 => bool) public claimed;

    event CryptoJobBoardUpdated(address indexed cryptoJobBoard);

    event NewProject(bytes32 projId, address budgetOwner, uint256 budget);

    event Payed(uint256 projId, address to, uint256 amount);

    event Redeemed(address to, uint256 amount);

    address private _deployer;

    constructor(
        address _gov,
        address _commitmentToken,
        address _projectToken,
        address _baseCurrency
    ) ERC20Recoverer() Governed() HasInitializer() {
        commitmentToken = CommitmentToken(_commitmentToken);
        baseCurrency = IERC20(_baseCurrency);
        ERC20Recoverer.disablePermanently(_baseCurrency);
        ERC20Recoverer.disablePermanently(_commitmentToken);
        ERC20Recoverer.setRecoverer(_gov);
        project = IERC721(_projectToken);
        Governed.setGovernance(_gov);
        _deployer = msg.sender;
    }

    modifier onlyDeployer() {
        require(_deployer == msg.sender, "Only deployer");
        _;
    }

    modifier onlyProjectOwner(uint256 projId) {
        require(
            project.ownerOf(projId) == msg.sender,
            "Not the project owner."
        );
        _;
    }

    modifier onlyCryptoJobBoard() {
        require(
            cryptoJobBoards[msg.sender] || msg.sender == gov,
            "Not authorized"
        );
        _;
    }

    function init(address cryptoJobBoard) public initializer {
        _setCryptoJobBoard(cryptoJobBoard, true);
    }

    function redeem(uint256 amount) public {
        require(
            commitmentToken.balanceOf(msg.sender) >= amount,
            "Not enough balance"
        );
        commitmentToken.burnFrom(msg.sender, amount);
        baseCurrency.transfer(msg.sender, amount);
        emit Redeemed(msg.sender, amount);
    }

    function payInsteadOfWorking(uint256 amount) public {
        uint256 amountToPay = amount.mul(priceOfCommitmentToken).div(10000);
        baseCurrency.safeTransferFrom(msg.sender, address(this), amountToPay);
        _mintCommitmentToken(msg.sender, amount);
    }

    function compensate(
        uint256 projectId,
        address to,
        uint256 amount
    ) public onlyProjectOwner(projectId) {
        require(projectFund[projectId] >= amount);
        projectFund[projectId] = projectFund[projectId] - amount; // "require" protects underflow
        commitmentToken.transfer(to, amount);
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
        commitmentToken.transfer(to, amount);
        emit Payed(projectId, to, amount);
    }

    function allocateFund(uint256 projId, uint256 budget)
        public
        override
        onlyCryptoJobBoard
    {
        require(budget <= remainingBudget());
        _mintCommitmentToken(address(this), budget);
        projectFund[projId] = projectFund[projId].add(budget);
    }

    function setCryptoJobBoard(address cryptoJobBoard, bool active)
        public
        governed
    {
        _setCryptoJobBoard(cryptoJobBoard, active);
    }

    function remainingBudget() public view returns (uint256) {
        uint256 currentSupply = commitmentToken.totalSupply();
        uint256 currentRedeemable = baseCurrency.balanceOf(address(this));
        return currentRedeemable.sub(currentSupply);
    }

    function _mintCommitmentToken(address to, uint256 amount) internal {
        require(amount <= remainingBudget(), "Out of budget");
        commitmentToken.mint(to, amount);
    }

    function _setCryptoJobBoard(address cryptoJobBoard, bool active) internal {
        if (cryptoJobBoards[cryptoJobBoard] != active) {
            emit CryptoJobBoardUpdated(cryptoJobBoard);
        }
        cryptoJobBoards[cryptoJobBoard] = active;
    }
}