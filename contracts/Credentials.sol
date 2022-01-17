// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Credential is ERC721URIStorage, Ownable, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    // all the tokens hold by the owner
    mapping(address => uint256[]) ownerCredentials;

    //Representation of Credential metadata
    /*
     * first byte from left refers NFT identity (00 - ETH Global , 01 -Variant Fund , 02-Binance ).
     * next byte from left refers Event - (00 - WebJam, 01- NFTHAck, 02 - DEFI event and so on).
     * next byte from left refers the category of the project.(00 - DEFI, 01-NFT, 02-DEX , 03-Analytics ).
     * next byte from left refers to the seed amount.
     * next nible from left refers the place the secured on hackathon. (1- first place, 2 - second place and so on).
     * next nible from left refers the seed the secured on hackathon. (1- Seed A, 2 - seed B, and so on).
     */
    //mapping to get identifier of Token
    mapping(uint256 => bytes4) identifiersOfCredential;

    EnumerableSet.AddressSet internal minters;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        minters.add(owner());
    }

    function isMinter(address _minter) internal view returns (bool _role) {
        return minters.contains(_minter);
    }

    // add a minter address can be done only from owner
    function addMinterRole(address _minter) public onlyOwner {
        require(_minter != address(this));
        if (!minters.contains(_minter)) {
            minters.add(_minter);
        }
    }

    // remove a minter address can be done only from owner
    function removeMinterRole(address _minter) public onlyOwner {
        require(minters.contains(_minter));
        minters.remove(_minter);
    }

    function canTransfer() external view returns (bool _status) {
        return (!paused() || _msgSender() == owner());
    }

    //Note: For current version pass empty tokenURI.
    //TODO: ADD MAX SUPPLY?
    //TODO: Add cost for some social capitalist group?
    function mintAnItem(
        address to_,
        string memory tokenURI_,
        bytes4 credentialIdentifier
    ) external returns (uint256) {
        require(
            minters.contains(msg.sender),
            "permission denied"
        );

        _tokenIds.increment();

        uint256 newCredential = _tokenIds.current();

        _safeMint(to_, newCredential);

        _setTokenURI(newCredential, tokenURI_);

        ownerCredentials[to_].push(newCredential);

        identifiersOfCredential[newCredential] = credentialIdentifier;

        return newCredential;
    }

    //Implemented hook that ovverides the function to make it nontransferable until desired
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal view override {
        if (paused()) {
            require(
                _msgSender() == owner() || minters.contains(_msgSender()),
                "Only the Owner can Transfer or Mint until pause"
            );
        }
    }

    // if a contract is paused only owner() can mint and transfer
    function pause() public onlyOwner {
        _pause();
    }

    //if a contract is unpaused any one having minter role can mint
    //Transferable if unpaused
    function unPause() public onlyOwner {
        _unpause();
    }

    function getCredentials(address owner_)
        public
        view
        returns (uint256[] memory)
    {
        require(
            ownerCredentials[owner_].length > 0,
            "no credentials found"
        );
        return ownerCredentials[owner_];
    }

    function getIdentifiers(uint256 credential_) public view returns (bytes4) {
        return identifiersOfCredential[credential_];
    }
}
