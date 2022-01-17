const { ethers } = require("hardhat");


function getHex(hex) {
    return ethers.utils.arrayify(hex);;
}

function tokens(val) {
    return ethers.utils.parseEther(val);
}

function format(n) {
    return ethers.utils.formatEther(n);
}

// getFundIndexById is helper function to return array index of fund by its id
async function helperGetFundIndexById(fundContract, fundId) {
    let allFundDetails = await fundContract.getAllFundDetails()
    for (let index = 0; index < allFundDetails.length; index++) {
        if (allFundDetails[index].fundId.toNumber() == fundId.toNumber()) {
            return index;
        }
    }

    throw new Error("fund not found");
}

// getFundByDetailsId is helper function to return fund details by its id.
async function helperGetFundDetailsById(fundContract, fundId) {
    let fundIndex = await helperGetFundIndexById(fundContract, fundId)
    let allFundDetails = await fundContract.getAllFundDetails()
    return allFundDetails[fundIndex];
}


// mintAnItem version of function which returns the solidity return value from event.
async function helperMintAnItem(credentialContract, ...args) {
    const tx = await credentialContract.mintAnItem(...args);
    const receipt = await tx.wait();
    const event = receipt.events.find(event => event.event === 'Transfer');
    return event.args['tokenId']
}

// createFund version of create fund function which return 
// the fund id, by listening to the event.
async function helperCreateFund(fundContract, ...args) {
    const tx = await fundContract.createFund(...args);
    const receipt = await tx.wait();
    const event = receipt.events.find(event => event.event === 'FundCreated');
    return event.args['fundId']

}

module.exports = {
    getHex,
    tokens,
    format,
    helperGetFundIndexById,
    helperGetFundDetailsById,
    helperCreateFund,
    helperMintAnItem,
};