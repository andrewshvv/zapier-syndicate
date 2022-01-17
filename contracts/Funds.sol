// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Credentials.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract Funds {
    using Counters for Counters.Counter;

    string public Name = "Fund";

    //
    Credentials public credentials;

    // fundIdIterator is used to assign the unique id to the fund.
    Counters.Counter private fundIdIterator;

    constructor(Credentials credentialsAddress) payable {
        credentials = credentialsAddress;
    }

    struct FundDetails {
        uint256 fundId;
        string name;
        string description;
        address createdBy;
        uint256 createdDate;
        uint256 currentBalance;
        // fundingAmount is amount given per funding event.
        uint256 fundingAmount;
        // TODO: comment credentailsUsed...
        // TODO: should be the list of credential's types used in the fund.
        bytes4 credentailsUsed;
    }

    FundDetails[] internal allFundDetails;

    // fundingTable stores the information about which address received the funding.
    // Used to avoid the double-spend.
    mapping(uint256 => mapping(address => uint256)) fundingTable;
    // TODO: What is this used for?
    mapping(uint256 => mapping(address => uint256)) depositTable;

    // FundCreated event is fired when new new fund is created.
    event FundCreated(address indexed createdBy, uint256 fundId);
    // Deposit event is fired when new deposit comes in.
    event Deposit(address indexed sender, uint256 amount);
    // Funding event is fired when new funding is given.
    event Funding(address indexed to, uint256 amount);

    function createFund(
        string memory name,
        string memory description,
        uint256 fundingAmount,
        bytes4 credentailsUsed
    ) external returns (uint256) {
        fundIdIterator.increment();

        FundDetails memory newFundDetials = FundDetails(
            fundIdIterator.current(),
            name,
            description,
            msg.sender,
            block.timestamp,
            0,
            fundingAmount,
            credentailsUsed
        );

        allFundDetails.push(newFundDetials);
        emit FundCreated(msg.sender, newFundDetials.fundId);

        return newFundDetials.fundId;
    }

    // getAllFundDetails returns the details of all the funds. Primarily used by web apps.
    function getAllFundDetails() external view returns (FundDetails[] memory) {
        return allFundDetails;
    }

    // depositFunds deposit funds in the fund.
    // NOTE: fund array index is used, not a fund id.
    function depositFunds(uint256 fundIndex) external payable {
        FundDetails storage fundDetails = allFundDetails[fundIndex];

        require(
            msg.value > fundDetails.fundingAmount,
            "deposit is less than funding amount"
        );

        fundDetails.currentBalance += msg.value;
        depositTable[fundDetails.fundId][msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // eligableFunds returns the funds that are eligable for funding
    // with the given set of credentials. Used by the web app.
    function eligableFunds(uint256[] memory credentialsIds)
        external
        view
        returns (uint256[] memory)
    {
        // ownership verification
        uint256 credentialLength = credentialsIds.length;
        for (uint256 index = 0; index < credentialLength; index++) {
            address ownerAddress = credentials.ownerOf(credentialsIds[index]);
            require(
                ownerAddress == msg.sender,
                "credential isn't owner by sender"
            );
        }
        //return matched fund ids
        uint256[] memory fundIds = new uint256[](allFundDetails.length);
        for (uint256 index = 0; index < credentialLength; index++) {
            bytes4 identifier = credentials.getIdentifiers(
                credentialsIds[index]
            );

            for (
                uint256 indexOFfundId = 0;
                indexOFfundId < allFundDetails.length;
                indexOFfundId++
            ) {
                if (
                    identifier == allFundDetails[indexOFfundId].credentailsUsed
                ) {
                    fundIds[index] = allFundDetails[indexOFfundId].fundId;
                }
            }
        }

        return fundIds;
    }

    // getFunding...
    // NOTE: Fund index is used, not fund id.
    function getFunding(uint256 credential, uint256 fundIndex) external {
        // TODO: should receive the set of credentials.

        // ownership verification
        address ownerAddress = credentials.ownerOf(credential);
        require(
            ownerAddress == msg.sender,
            "credentails isn't owned by sender"
        );

        // check for identifiers and transfer
        bytes4 identifier = credentials.getIdentifiers(credential);
        FundDetails memory fundDetails = allFundDetails[fundIndex];

        if (identifier != fundDetails.credentailsUsed) {
            revert("credential doesn't match");
        }

        require(
            fundingTable[fundDetails.fundId][msg.sender] == 0,
            "already withdrawn for this fund"
        );

        console.log(fundDetails.currentBalance, fundDetails.fundingAmount);
        require(
            fundDetails.currentBalance > fundDetails.fundingAmount,
            "not enough funds to withdraw"
        );

        // TODO: transfer is not secure? Use OZ Address?
        payable(msg.sender).transfer(fundDetails.fundingAmount);

        fundDetails.currentBalance -= fundDetails.fundingAmount;
        fundingTable[fundDetails.fundId][msg.sender] = fundDetails.fundingAmount;
        emit Funding(msg.sender, fundDetails.fundingAmount);
    }
}
