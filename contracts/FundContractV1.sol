// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NftFactoryV1.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";



contract FundContractV1 is ReentrancyGuard {

    string public Name = "FundContractV1";

    NftFactoryV1 public nftFactoryV1;

    using Counters for Counters.Counter;

    Counters.Counter private fundType_;

    constructor(NftFactoryV1  NftFactoryV1_) ReentrancyGuard() payable{
        nftFactoryV1 = NftFactoryV1_;
    }

    uint256 public minimumEthToDepoit = 0.01 ether;
    
    struct FundDetails{
        uint256 fundType;
        string name;
        string description;
        address createdBy;
        uint256 createdDate;
        uint256 totalAmountDeposited;
        uint256 totalAmountDisbursed;
        uint256 maxDistributableAmountPerTeam;
        bytes4 credentailsUsed;
    }

    FundDetails[] internal AllFundDetails  ;

    mapping(uint256=>mapping(address => uint256)) amountDisbursedFromFundByaTeam;

    mapping(uint256=>mapping(address => uint256)) grantProvidedToFundByanInvestor;

    event deposit(address indexed sender, uint256 amount, string message);

    event transfer(address indexed to, uint256 amount , string message);

    function createFund(
        string memory name_, 
        string memory description_, 
        uint256 distributionAmountPerTram_,
        bytes4 credentailsUsed_) 
        external
        returns(uint256)
        {
            fundType_.increment();

            uint256 newFundType = fundType_.current();
            address createdBy = msg.sender;

            FundDetails memory newFundDetials = FundDetails(
                newFundType,
                name_,
                description_,
                createdBy,
                block.timestamp,
                0,
                0,
                distributionAmountPerTram_,
                credentailsUsed_);

            AllFundDetails.push(newFundDetials);

            return newFundType;
        }

    function getFundetails() external view returns(FundDetails[] memory){

        return  AllFundDetails;
    }

    function depositFund(uint256 fundType_) external payable {

         require(
            msg.value > minimumEthToDepoit,
            "Requireed minimmum 0.01 Eth to Deposit"
        );

        bool isDeposited = false;
        for(uint256 index =0; index < AllFundDetails.length; index++){
            if(AllFundDetails[index].fundType == fundType_){
                AllFundDetails[index].totalAmountDeposited = AllFundDetails[index].totalAmountDeposited + msg.value;
                grantProvidedToFundByanInvestor[fundType_][msg.sender] = 
                    grantProvidedToFundByanInvestor[fundType_][msg.sender] + msg.value;
                isDeposited = true;
            }
        }

        emit deposit(msg.sender, msg.value, isDeposited?"ETH deposited":"FundTypeNotFound");
    }

    function evaluavateNFTCredentials( uint256[] memory credentials_) external view returns(uint256[] memory fundtypes_){

        //Ownership verification
        uint256 credentialLength = credentials_.length;
        for(uint256 index=0 ; index<credentialLength ; index++)
        {
            address ownerAddress = nftFactoryV1.ownerOf(credentials_[index]);
            require(ownerAddress == msg.sender, "Credentails not owned by msg.sender");
        }
        //return matched funddetails 
        uint256[] memory matchedFundTypes = new uint256[](AllFundDetails.length);
        for(uint256 index=0 ; index<credentialLength ; index++){
            bytes4 identifier = nftFactoryV1.getIdentifiers(credentials_[index]);

            for(uint256 indexOFfundType=0 ; indexOFfundType<AllFundDetails.length; indexOFfundType++){

                if(identifier == AllFundDetails[indexOFfundType].credentailsUsed){
                    matchedFundTypes[index]=AllFundDetails[indexOFfundType].fundType;
                }
            }
        }

        return matchedFundTypes;
    }

    function getFunding(uint256 credential_, uint256 fundType_) nonReentrant external {

        //Ownership verification
        address ownerAddress = nftFactoryV1.ownerOf(credential_);
        require(ownerAddress == msg.sender, "Credentails not owned by msg.sender");

        // check for identifiers and transfer
        bytes4 identifier = nftFactoryV1.getIdentifiers(credential_);
        for(uint256 indexOFfundType=0 ; indexOFfundType<AllFundDetails.length; indexOFfundType++){

                if(fundType_ == AllFundDetails[indexOFfundType].fundType){

                     if(identifier == AllFundDetails[indexOFfundType].credentailsUsed){
                         
                         require(
                             amountDisbursedFromFundByaTeam[AllFundDetails[indexOFfundType].fundType][msg.sender] == 0,
                             "Already Withdrawed for this fund"
                         );
                         require(
                             AllFundDetails[indexOFfundType].totalAmountDeposited - AllFundDetails[indexOFfundType].totalAmountDisbursed > 
                             AllFundDetails[indexOFfundType].maxDistributableAmountPerTeam,
                             "Not Enough Fund to withdraw"
                         );     

                        AllFundDetails[indexOFfundType].totalAmountDisbursed = 
                            AllFundDetails[indexOFfundType].totalAmountDisbursed + AllFundDetails[indexOFfundType].maxDistributableAmountPerTeam;

                        amountDisbursedFromFundByaTeam[AllFundDetails[indexOFfundType].fundType][msg.sender] = AllFundDetails[indexOFfundType].maxDistributableAmountPerTeam;

                        payable(msg.sender).transfer(AllFundDetails[indexOFfundType].maxDistributableAmountPerTeam);
                        
                        emit transfer(msg.sender,AllFundDetails[indexOFfundType].maxDistributableAmountPerTeam, "Founding Team withdrawn" );

                        break;
                    }
                }
               
            }
    }
}