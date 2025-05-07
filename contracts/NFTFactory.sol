// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./NFT721Royalty.sol";
import "./NFT1155Royalty.sol";
import "./ICollectionTypes.sol";

struct CollectionData {
    address creator;
    address collection;
    string collectionType;
    string name;
    string symbol;
    uint256 maxSupply;
    uint256 mintPrice;
    uint256 maxPerWallet;
    uint256 releaseDate;
    uint256 mintEndDate;
    bool infiniteMint;
}

struct InitParams {
    address collection;
    string collectionType;
    string name;
    string symbol;
    string metadataURI;
    ICollectionTypes.CollectionConfig config;
}

struct CreateCollectionParams {
    string collectionType;
    string name;
    string symbol;
    string metadataURI;
    uint256 maxSupply;
    uint256 mintPrice;
    uint256 maxPerWallet;
    uint256 releaseDate;
    uint256 mintEndDate;
    bool infiniteMint;
    address paymentToken;
    bool enableWhitelist;
    address royaltyReceiver;
    uint96 royaltyFeeNumerator;
}

struct CreateNFTCollectionParams {
    string collectionType;
    string name;
    string symbol;
    string metadataURI;
    uint256 maxSupply;
    uint256 mintPrice;
    uint256 maxPerWallet;
    uint256 releaseDate;
    uint256 mintEndDate;
    bool infiniteMint;
    address paymentToken;
    bool enableWhitelist;
    address royaltyReceiver;
    uint96 royaltyFeeNumerator;
}

contract NFTFactory is Ownable, ReentrancyGuard, ICollectionTypes {
    using Clones for address;

    address public immutable nft721Implementation;
    address public immutable nft1155Implementation;
    
    uint256 public sepoliaFee = 0.015 ether;
    uint256 public polygonFee = 20 ether;
    uint256 public unichainFee = 0.015 ether;
    uint256 public moonwalkerFee = 369 ether;
    uint256 public monadFee = 2 ether;  // 2 MON fee for Monad network

    mapping(address => address[]) public creatorCollections;
    mapping(address => string) public collectionMetadata;

    event CollectionCreated(CollectionData data);
    event PaymentTokenSet(
        address indexed collection,
        address indexed paymentToken,
        string collectionType,
        uint256 mintPrice
    );
    event ConfigCreated(
        address indexed collection,
        address indexed paymentToken,
        uint256 mintPrice,
        bool infiniteMint
    );
    event Debug(string message, uint256 value);

    constructor(address _nft721Implementation, address _nft1155Implementation) {
        require(_nft721Implementation != address(0), "Invalid 721 implementation");
        require(_nft1155Implementation != address(0), "Invalid 1155 implementation");
        nft721Implementation = _nft721Implementation;
        nft1155Implementation = _nft1155Implementation;
        _transferOwnership(msg.sender);
    }

    function _createConfig(
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint256 _maxPerWallet,
        uint256 _releaseDate,
        uint256 _mintEndDate,
        bool _infiniteMint,
        address _paymentToken,
        bool _enableWhitelist
    ) internal pure returns (CollectionConfig memory) {
        return CollectionConfig({
            maxSupply: _maxSupply,
            mintPrice: _mintPrice,
            maxPerWallet: _maxPerWallet,
            releaseDate: _releaseDate,
            mintEndDate: _mintEndDate,
            infiniteMint: _infiniteMint,
            paymentToken: _paymentToken,
            enableWhitelist: _enableWhitelist
        });
    }

    function _initializeCollection(InitParams memory params) internal {
        if (keccak256(bytes(params.collectionType)) == keccak256(bytes("ERC721"))) {
            NFT721Royalty(params.collection).initialize(
                params.name,
                params.symbol,
                params.metadataURI,
                params.config,
                msg.sender
            );
        } else {
            NFT1155Royalty(params.collection).initialize(
                params.name,
                params.symbol,
                params.metadataURI,
                params.config,
                msg.sender
            );
        }
    }

    function createNFTCollection(CreateNFTCollectionParams calldata params) external payable {
        CreateCollectionParams memory collectionParams = CreateCollectionParams({
            collectionType: params.collectionType,
            name: params.name,
            symbol: params.symbol,
            metadataURI: params.metadataURI,
            maxSupply: params.maxSupply,
            mintPrice: params.mintPrice,
            maxPerWallet: params.maxPerWallet,
            releaseDate: params.releaseDate,
            mintEndDate: params.mintEndDate,
            infiniteMint: params.infiniteMint,
            paymentToken: params.paymentToken,
            enableWhitelist: params.enableWhitelist,
            royaltyReceiver: params.royaltyReceiver,
            royaltyFeeNumerator: params.royaltyFeeNumerator
        });

        _createNFTCollection(collectionParams);
    }

    function _handleFees() internal view {
        if (block.chainid == 11155111) {
            require(msg.value >= sepoliaFee, "Insufficient fee");
        } else if (block.chainid == 137) {
            require(msg.value >= polygonFee, "Insufficient fee");
        } else if (block.chainid == 1301) {
            require(msg.value >= unichainFee, "Insufficient fee");
        } else if (block.chainid == 1828369849) {
            require(msg.value >= moonwalkerFee, "Insufficient fee");
        } else if (block.chainid == 10143) {  // Monad chain ID
            require(msg.value >= monadFee, "Insufficient fee");
        } else {
            revert("Unsupported network");
        }
    }

    function _deployCollection(string memory collectionType) internal returns (address) {
        address implementation = keccak256(bytes(collectionType)) == keccak256(bytes("ERC721")) 
            ? nft721Implementation 
            : nft1155Implementation;
        
        address clone = implementation.clone();
        require(clone != address(0), "Clone deployment failed");
        return clone;
    }

    function _finalizeCollection(
        address collection,
        string memory metadataURI,
        address creator
    ) internal {
        creatorCollections[creator].push(collection);
        collectionMetadata[collection] = metadataURI;
    }

    function _prepareCollectionConfig(
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint256 _maxPerWallet,
        uint256 _releaseDate,
        uint256 _mintEndDate,
        bool _infiniteMint,
        address _paymentToken,
        bool _enableWhitelist
    ) internal returns (CollectionConfig memory) {
        emit Debug("Payment Token in Config", uint256(uint160(_paymentToken)));
        
        return _createConfig(
            _maxSupply,
            _mintPrice,
            _maxPerWallet,
            _releaseDate,
            _mintEndDate,
            _infiniteMint,
            _paymentToken,
            _enableWhitelist
        );
    }

    function _createCollectionData(
        address collection,
        string memory _type,
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint256 _maxPerWallet,
        uint256 _releaseDate,
        uint256 _mintEndDate,
        bool _infiniteMint
    ) internal view returns (CollectionData memory) {
        return CollectionData({
            creator: msg.sender,
            collection: collection,
            collectionType: _type,
            name: _name,
            symbol: _symbol,
            maxSupply: _maxSupply,
            mintPrice: _mintPrice,
            maxPerWallet: _maxPerWallet,
            releaseDate: _releaseDate,
            mintEndDate: _mintEndDate,
            infiniteMint: _infiniteMint
        });
    }

    function _createNFTCollection(CreateCollectionParams memory params) internal {
        _handleFees();
        
        // Deploy with validation
        address collection = _deployCollection(params.collectionType);
        require(collection != address(0), "Collection deployment failed");
        
        // Create config
        CollectionConfig memory config = _prepareCollectionConfig(
            params.maxSupply,
            params.mintPrice,
            params.maxPerWallet,
            params.releaseDate,
            params.mintEndDate,
            params.infiniteMint,
            params.paymentToken,
            params.enableWhitelist
        );

        // Initialize directly instead of using low-level call
        if (keccak256(bytes(params.collectionType)) == keccak256(bytes("ERC721"))) {
            NFT721Royalty(collection).initialize(
                params.name,
                params.symbol,
                params.metadataURI,
                config,
                msg.sender,
                params.royaltyReceiver == address(0) ? msg.sender : params.royaltyReceiver,
                params.royaltyFeeNumerator
            );
        } else {
            NFT1155Royalty(collection).initialize(
                params.name,
                params.symbol,
                params.metadataURI,
                config,
                msg.sender,
                params.royaltyReceiver == address(0) ? msg.sender : params.royaltyReceiver,
                params.royaltyFeeNumerator
            );
        }

        // Store collection data
        creatorCollections[msg.sender].push(collection);
        collectionMetadata[collection] = params.metadataURI;

        // Emit events
        emit PaymentTokenSet(
            collection,
            params.paymentToken,
            params.collectionType,
            params.mintPrice
        );

        emit CollectionCreated(CollectionData({
            creator: msg.sender,
            collection: collection,
            collectionType: params.collectionType,
            name: params.name,
            symbol: params.symbol,
            maxSupply: params.maxSupply,
            mintPrice: params.mintPrice,
            maxPerWallet: params.maxPerWallet,
            releaseDate: params.releaseDate,
            mintEndDate: params.mintEndDate,
            infiniteMint: params.infiniteMint
        }));
    }

    function updateFees(
        uint256 _sepoliaFee, 
        uint256 _polygonFee,
        uint256 _unichainFee,
        uint256 _moonwalkerFee
    ) external onlyOwner {
        sepoliaFee = _sepoliaFee;
        polygonFee = _polygonFee;
        unichainFee = _unichainFee;
        moonwalkerFee = _moonwalkerFee;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}