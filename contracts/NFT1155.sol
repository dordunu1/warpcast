// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ICollectionTypes.sol";

contract NFT1155 is ERC1155, ReentrancyGuard, ICollectionTypes {
    using Strings for uint256;

    bool public initialized;
    address public owner;
    string public name;
    string public symbol;
    string public baseURI;
    CollectionConfig public config;
    uint256 public totalSupply;

    mapping(address => uint256) public mintedPerWallet;
    mapping(address => bool) public whitelist;
    mapping(address => uint256) public whitelistMintLimit;
    mapping(uint256 => uint256) public tokenSupply;
    mapping(uint256 => string) private _tokenURIs;

    event Minted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event BatchMinted(address indexed to, uint256[] tokenIds, uint256[] amounts);
    event Debug(string message, uint256 value); // Debug event for troubleshooting
    event ConfigInitialized(
        address indexed collection,
        address indexed paymentToken,
        uint256 mintPrice,
        bool infiniteMint
    );
    event PaymentTokenUpdated(
        address indexed collection,
        address indexed oldToken,
        address indexed newToken
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() ERC1155("") {}

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        CollectionConfig memory _config,
        address _owner
    ) external {
        require(!initialized, "Already initialized");
        require(_owner != address(0), "Invalid owner");

        initialized = true;
        owner = _owner;
        name = _name;
        symbol = _symbol;
        baseURI = _baseURI;
        config = _config;

        // Emit config initialization event
        emit ConfigInitialized(
            address(this),
            config.paymentToken,
            config.mintPrice,
            config.infiniteMint
        );

        _setURI(_baseURI);
    }

    function mint(uint256 tokenId, uint256 amount, string memory _tokenURI) external payable nonReentrant {
        require(block.timestamp >= config.releaseDate, "Minting not started");
        require(config.infiniteMint || block.timestamp <= config.mintEndDate, "Minting ended");
        require(totalSupply + amount <= config.maxSupply, "Exceeds max supply");
        require(mintedPerWallet[msg.sender] + amount <= config.maxPerWallet, "Exceeds wallet limit");

        if (config.enableWhitelist) {
            require(whitelist[msg.sender], "Not whitelisted");
            require(mintedPerWallet[msg.sender] + amount <= whitelistMintLimit[msg.sender], "Exceeds whitelist limit");
        }

        uint256 payment = config.mintPrice * amount;
        if (config.paymentToken == address(0)) {
            require(msg.value >= payment, "Insufficient payment");
            (bool success, ) = owner.call{value: payment}("");
            require(success, "Transfer failed");
        } else {
            require(IERC20(config.paymentToken).transferFrom(msg.sender, owner, payment), "Payment failed");
        }

        _mint(msg.sender, tokenId, amount, "");
        mintedPerWallet[msg.sender] += amount;
        tokenSupply[tokenId] += amount;
        totalSupply += amount;

        // Set token URI if provided
        if (bytes(_tokenURI).length > 0) {
            _tokenURIs[tokenId] = _tokenURI;
        }

        emit Minted(msg.sender, tokenId, amount);
    }

    function mintBatch(
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external payable nonReentrant {
        require(
            tokenIds.length == amounts.length,
            "Length mismatch"
        );

        require(block.timestamp >= config.releaseDate, "Minting not started");
        require(
            config.infiniteMint || block.timestamp <= config.mintEndDate,
            "Minting ended"
        );

        uint256 totalAmount;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        require(
            totalSupply + totalAmount <= config.maxSupply,
            "Exceeds max supply"
        );
        require(
            mintedPerWallet[msg.sender] + totalAmount <= config.maxPerWallet,
            "Exceeds wallet limit"
        );

        if (config.enableWhitelist) {
            require(whitelist[msg.sender], "Not whitelisted");
            require(
                mintedPerWallet[msg.sender] + totalAmount <=
                    whitelistMintLimit[msg.sender],
                "Exceeds whitelist limit"
            );
        }

        uint256 payment = config.mintPrice * totalAmount;
        if (config.paymentToken == address(0)) {
            require(msg.value >= payment, "Insufficient payment");
            (bool success, ) = owner.call{value: payment}("");
            require(success, "Transfer failed");
        } else {
            require(
                IERC20(config.paymentToken).transferFrom(
                    msg.sender,
                    owner,
                    payment
                ),
                "Payment failed"
            );
        }

        _mintBatch(msg.sender, tokenIds, amounts, "");
        mintedPerWallet[msg.sender] += totalAmount;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenSupply[tokenIds[i]] += amounts[i];
        }
        totalSupply += totalAmount;

        emit BatchMinted(msg.sender, tokenIds, amounts);
    }

    function setWhitelist(
        address[] calldata addresses,
        uint256[] calldata limits
    ) external onlyOwner {
        require(addresses.length == limits.length, "Length mismatch");
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = true;
            whitelistMintLimit[addresses[i]] = limits[i];
        }
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If there's no individual URI, use the base URI with tokenId
        if (bytes(_tokenURI).length == 0) {
            return string(abi.encodePacked(baseURI, tokenId.toString()));
        }
        
        // If both baseURI and tokenURI are set, concatenate them
        if (bytes(baseURI).length > 0) {
            return string(abi.encodePacked(baseURI, _tokenURI));
        }
        
        return _tokenURI;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(tokenSupply[tokenId] > 0, "ERC1155: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
        emit URI(_tokenURI, tokenId);
    }

    // View functions
    function exists(uint256 tokenId) public view returns (bool) {
        return tokenSupply[tokenId] > 0;
    }

    function totalSupplyOf(uint256 tokenId) public view returns (uint256) {
        return tokenSupply[tokenId];
    }

    function setPaymentToken(address _paymentToken) external onlyOwner {
        address oldToken = config.paymentToken;
        config.paymentToken = _paymentToken;
        emit PaymentTokenUpdated(address(this), oldToken, _paymentToken);
    }
}
