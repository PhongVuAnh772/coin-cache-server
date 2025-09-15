// contracts/MultiNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MultiNFT is ERC721 {
    uint256 public tokenIdCounter;

    constructor() ERC721("MultiNFT", "MNFT") {}

    function mintNFT(address to) external {
        _safeMint(to, tokenIdCounter);
        tokenIdCounter++;
    }
}
