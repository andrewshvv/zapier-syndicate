// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// TODO: Add proper credential type
// - Those who own the type nft can create credentials of particular type of particular supply
// - Type nft is storing the data schema of the credential in protobuf
// - Types do not store the metadata of the credential
// - Credentials do not store the data schema
// - URI of credential type is data schema
// - URI of credential is metadata

contract Credentials is ERC721URIStorage, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using Counters for Counters.Counter;

    /// @notice is an iterator which assigns new credential ids.
    Counters.Counter private IDIterator;

    /// @notice is the set of adressed eligable to minter credential.
    EnumerableSet.AddressSet internal minters;

    /// @notice mapping of owner to the all the credential owner holds
    mapping(address => uint256[]) private ownerCredentials;

    /// @notice mapping of credential id to credential metadata
    mapping(uint256 => bytes) private credentialToMetadata;

    /// @notice credentialToType mapping of credential id to credential type.
    mapping(uint256 => uint256) private credentialToType;

    constructor(string memory name_, string memory symbol_)
    ERC721(name_, symbol_)
    {
        minters.add(owner());
    }

    /// @notice checks whether the address is able to mint credentials.
    /// @param minter_ address of the account to mint the credential to.
    function isMinter(address minter_) internal view returns (bool) {
        return minters.contains(minter_);
    }

    /// @notice return type of credential
    /// @param credentialId_ id of credential
    /// @return type of credential
    function typeOf(uint256 credentialId_) public view returns (uint256) {
        return credentialToType[credentialId_];
    }

    // add a minter address can be done only from owner
    function addMinterRole(address minter_) public onlyOwner {
        require(minter_ != address(this));
        if (!minters.contains(minter_)) {
            minters.add(minter_);
        }
    }

    // remove a minter address can be done only from owner
    function removeMinterRole(address minter_) public onlyOwner {
        require(minters.contains(minter_));
        minters.remove(minter_);
    }

    /// @notice mints a new credential to the given address.
    /// @param to_ address of the account to mint the credential to.
    /// @param credentialURI_ tokenURI of the credential.
    /// @param type_ type of the credential.
    /// @param credentialMetadata_ metadata of the credential.
    /// @return id of the newly minted credential.
    function mintCredential(
        address to_,
        string memory credentialURI_, // For current version pass empty tokenURI.
        uint256 type_,
        bytes memory credentialMetadata_
    ) external returns (uint256) {
        require(minters.contains(msg.sender), "permission denied");

        // TODO: Add max supply per credential type?
        // TODO: Check credential data schema somehow? Minter can put any data?
        // Can it lead to some security issue?

        IDIterator.increment();
        uint256 credentialId = IDIterator.current();

        _safeMint(to_, credentialId);
        _setTokenURI(credentialId, credentialURI_);

        ownerCredentials[to_].push(credentialId);
        credentialToMetadata[credentialId] = credentialMetadata_;
        credentialToType[credentialId] = type_;

        return credentialId;
    }

    //Implemented hook that ovverides the function to make it nontransferable until desired
    function _beforeTokenTransfer(
        address from_,
        address to_,
        uint256 credentialId_
    ) internal view override {
        require(msg.sender == owner(), "Only the owner can transfer");
    }

    function getCredentials(address owner_)
    public
    view
    returns (uint256[] memory)
    {
        return ownerCredentials[owner_];
    }

    function metadataOf(uint256 credentialId_)
    public
    view
    returns (bytes memory)
    {
        return credentialToMetadata[credentialId_];
    }
}
