// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICollectionTypes {
    struct CollectionConfig {
        uint256 maxSupply;
        uint256 mintPrice;
        uint256 maxPerWallet;
        uint256 releaseDate;
        uint256 mintEndDate;
        bool infiniteMint;
        address paymentToken;
        bool enableWhitelist;
    }
} 