 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./NFT721.sol";

contract NFT721Royalty is NFT721, ERC2981 {
    constructor() NFT721() {
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
        // Initialize the parent contract first
        (bool success,) = address(this).call(
            abi.encodeWithSelector(
                NFT721.initialize.selector,
                _name,
                _symbol,
                _baseURI,
                _config,
                _owner
            )
        );
        require(success, "Parent initialization failed");

        // Set royalty info
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
    }

    // Override supportsInterface to support both ERC721 and ERC2981
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Allow owner to update royalty info
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // Allow owner to set token-specific royalty
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }
}
