//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "../../utils/ERC20Recoverer.sol";
import "../../core/dividend/libraries/Distributor.sol";
import "../../core/dividend/interfaces/IDividendPool.sol";
import "../../core/governance/Governed.sol";
import "../../core/marketplace/interfaces/IMarketplace.sol";

contract Marketplace is
    Distributor,
    ERC20Recoverer,
    Governed,
    ReentrancyGuard,
    ERC1155Burnable,
    IMarketplace,
    Initializable
{
    struct Product {
        address manufacturer;
        uint256 totalSupply;
        uint256 maxSupply;
        uint256 price;
        uint256 profitRate;
        string uri;
    }

    using SafeERC20 for IERC20;
    using SafeERC20 for ERC20Burnable;
    using SafeMath for uint256;

    ERC20Burnable commitToken;

    uint256 public taxRate = 2000; // denominator is 10,000

    mapping(uint256 => Product) public override products;

    uint256 public constant RATE_DENOMINATOR = 10000;

    modifier onlyManufacturer(uint256 id) {
        require(
            msg.sender == products[id].manufacturer,
            "allowed only for manufacturer"
        );
        _;
    }

    constructor() ERC1155("") {
        // this constructor will not be called since it'll be cloned by proxy pattern.
        // initalize() will be called instead.
    }

    function initialize(
        address _gov,
        address _commitToken,
        address _dividendPool
    ) public initializer {
        commitToken = ERC20Burnable(_commitToken);
        ERC20Recoverer.setRecoverer(_gov);
        Governed.initialize(_gov);
        Distributor._setup(_dividendPool);
    }

    function buy(
        uint256 id,
        address to,
        uint256 amount
    ) public override nonReentrant {
        require(amount > 0, "cannot buy 0");
        // check the product is for sale
        Product storage product = products[id];
        require(product.manufacturer != address(0), "Product not exists");
        uint256 stock = product.maxSupply - product.totalSupply;
        require(product.maxSupply == 0 || amount <= stock, "Sold out");
        require(product.maxSupply == 0 || stock > 0, "Not for sale.");
        uint256 totalPayment = product.price.mul(amount); // SafeMath prevents overflow
        // Vision Tax
        uint256 visionTax = totalPayment.mul(taxRate).div(RATE_DENOMINATOR);
        // Burn tokens
        uint256 postTax = totalPayment.sub(visionTax);
        uint256 forManufacturer =
            postTax.mul(product.profitRate).div(RATE_DENOMINATOR);
        uint256 amountToBurn = postTax.sub(forManufacturer);
        commitToken.safeTransferFrom(msg.sender, address(this), visionTax);
        commitToken.safeTransferFrom(
            msg.sender,
            product.manufacturer,
            forManufacturer
        );
        commitToken.burnFrom(msg.sender, amountToBurn);
        _distribute(address(commitToken), visionTax);
        // mint & give
        _mint(to, id, amount, "");
    }

    function manufacture(
        string memory cid,
        uint256 profitRate,
        uint256 price
    ) external override {
        uint256 id = uint256(keccak256(abi.encodePacked(cid, msg.sender)));
        products[id] = Product(msg.sender, 0, 0, price, profitRate, cid);
        emit NewProduct(id, msg.sender, cid);
    }

    function manufactureLimitedEdition(
        string memory cid,
        uint256 profitRate,
        uint256 price,
        uint256 maxSupply
    ) external override {
        uint256 id = uint256(keccak256(bytes(cid)));
        products[id] = Product(
            msg.sender,
            0,
            maxSupply,
            price,
            profitRate,
            cid
        );
        emit NewProduct(id, msg.sender, cid);
    }

    /**
     * @notice Set max supply and make it a limited edition.
     */
    function setMaxSupply(uint256 id, uint256 _maxSupply)
        external
        override
        onlyManufacturer(id)
    {
        require(products[id].maxSupply == 0, "Max supply is already set");
        require(
            products[id].totalSupply <= _maxSupply,
            "Max supply is less than current supply"
        );
        products[id].maxSupply = _maxSupply;
    }

    function setPrice(uint256 id, uint256 price)
        public
        override
        onlyManufacturer(id)
    {
        // to prevent overflow
        require(price * 1000000000 > price, "Cannot be expensive too much");
        products[id].price = price;
        emit PriceUpdated(id, price);
    }

    /**
     * @notice The profit rate is based on the post-tax amount of the payment.
     *      For example, when the price is 10000 DCT, tax rate is 2000, and profit rate is 5000,
     *      2000 DCT will go to the vision farm, 4000 DCT will be burnt, and 4000 will be given
     *      to the manufacturer.
     */
    function setProfitRate(uint256 id, uint256 profitRate)
        public
        override
        onlyManufacturer(id)
    {
        require(profitRate <= RATE_DENOMINATOR, "Profit rate is too high");
        products[id].profitRate = profitRate;
        emit ProfitRateUpdated(id, profitRate);
    }

    function setTaxRate(uint256 rate) public override governed {
        require(rate <= RATE_DENOMINATOR);
        taxRate = rate;
    }

    function uri(uint256 id)
        external
        view
        override(IERC1155MetadataURI, ERC1155)
        returns (string memory)
    {
        return string(abi.encodePacked("ipfs://", products[id].uri));
    }

    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        uint256 newSupply = products[id].totalSupply.add(amount);
        require(
            products[id].maxSupply == 0 || newSupply <= products[id].maxSupply,
            "Sold out"
        );
        products[id].totalSupply = newSupply;
        super._mint(account, id, amount, data);
    }

    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 newSupply = products[id].totalSupply.add(amounts[i]);
            require(
                products[id].maxSupply == 0 ||
                    newSupply <= products[id].maxSupply,
                "Sold out"
            );
            products[id].totalSupply = newSupply;
        }
        super._mintBatch(to, ids, amounts, data);
    }
}
