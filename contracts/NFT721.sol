// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ICollectionTypes.sol";

contract NFT721 is ERC721, ReentrancyGuard, ICollectionTypes {
    using Strings for uint256;

    bool public initialized;
    address public owner;
    string private tokenBaseURI;
    CollectionConfig public config;
    uint256 public totalSupply;
    
    mapping(address => uint256) public mintedPerWallet;
    mapping(address => bool) public whitelist;
    mapping(address => uint256) public whitelistMintLimit;
    mapping(uint256 => string) private _tokenURIs;

    string public name_;
    string public symbol_;

    event Minted(address indexed to, uint256 tokenId);
    event Initialized(address indexed owner, string name, string symbol);
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
    event Debug(string message, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() ERC721("NFT Implementation", "NFTIMPL") {
        owner = msg.sender;
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _tokenURI,
        CollectionConfig memory _config,
        address _owner
    ) external {
        require(!initialized, "Already initialized");
        require(_owner != address(0), "Invalid owner");
        
        emit Debug("Payment Token at Init", uint256(uint160(_config.paymentToken)));
        
        name_ = _name;
        symbol_ = _symbol;
        tokenBaseURI = _tokenURI;
        config = _config;
        owner = _owner;
        initialized = true;
        
        // Emit config initialization event
        emit ConfigInitialized(
            address(this),
            config.paymentToken,
            config.mintPrice,
            config.infiniteMint
        );
        emit Initialized(_owner, _name, _symbol);
    }

    function name() public view override returns (string memory) {
        return name_;
    }

    function symbol() public view override returns (string memory) {
        return symbol_;
    }

    function mint(uint256 quantity, string memory _tokenURI) external payable nonReentrant {
        require(block.timestamp >= config.releaseDate, "Minting not started");
        require(config.infiniteMint || block.timestamp <= config.mintEndDate, "Minting ended");
        require(totalSupply + quantity <= config.maxSupply, "Exceeds max supply");
        require(mintedPerWallet[msg.sender] + quantity <= config.maxPerWallet, "Exceeds wallet limit");
        
        if (config.enableWhitelist) {
            require(whitelist[msg.sender], "Not whitelisted");
            require(mintedPerWallet[msg.sender] + quantity <= whitelistMintLimit[msg.sender], "Exceeds whitelist limit");
        }

        uint256 payment = config.mintPrice * quantity;
        if (config.paymentToken == address(0)) {
            require(msg.value >= payment, "Insufficient payment");
            (bool success, ) = owner.call{value: msg.value}("");
            require(success, "Transfer failed");
        } else {
            require(IERC20(config.paymentToken).transferFrom(msg.sender, owner, payment), "Payment failed");
        }

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = totalSupply + 1;
            _safeMint(msg.sender, tokenId);
            if (bytes(_tokenURI).length > 0) {
                _tokenURIs[tokenId] = _tokenURI;
            }
            totalSupply++;
            emit Minted(msg.sender, tokenId);
        }
        
        mintedPerWallet[msg.sender] += quantity;
    }

    function setWhitelist(address[] calldata addresses, uint256[] calldata limits) external onlyOwner {
        require(addresses.length == limits.length, "Length mismatch");
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = true;
            whitelistMintLimit[addresses[i]] = limits[i];
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return tokenBaseURI;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(exists(tokenId), "ERC721: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(exists(tokenId), "ERC721: URI query for nonexistent token");
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If there's no individual URI, use the base URI with tokenId
        if (bytes(_tokenURI).length == 0) {
            return string(abi.encodePacked(tokenBaseURI, tokenId.toString()));
        }
        
        // If both baseURI and tokenURI are set, concatenate them
        if (bytes(tokenBaseURI).length > 0) {
            return string(abi.encodePacked(tokenBaseURI, _tokenURI));
        }
        
        return _tokenURI;
    }

    function setPaymentToken(address _paymentToken) external onlyOwner {
        address oldToken = config.paymentToken;
        config.paymentToken = _paymentToken;
        emit PaymentTokenUpdated(address(this), oldToken, _paymentToken);
    }
} 