// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./NFT1155.sol";

contract NFT1155Royalty is NFT1155, ERC2981 {
    constructor() NFT1155() {
        // Constructor remains the same
    }

    // Initialize with royalty info
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        CollectionConfig memory _config,
        address _owner,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) external {
        require(!initialized, "Already initialized");
        name = _name;
        symbol = _symbol;
        baseURI = _baseURI;
        config = _config;
        owner = _owner;
        initialized = true;

        // Set royalty info
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
    }

    // Override supportsInterface to support both ERC1155 and ERC2981
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Allow owner to update royalty info
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external {
        require(msg.sender == owner, "Not owner");
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // Allow owner to set token-specific royalty
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external {
        require(msg.sender == owner, "Not owner");
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }
}  