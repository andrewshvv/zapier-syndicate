const { ethers } = require("hardhat");

module.exports = {
    getHex: function (hex) {
        return ethers.utils.arrayify(hex);;
    },

    tokens: function (val) {
        return ethers.utils.parseEther(val);
    },

    format: function (n) {
        return ethers.utils.formatEther(n);
    },

    fundHelperWrapper: function (fundContract) {

        // getFundIndexById is helper function to return array index of fund by its id
        helperGetFundIndexById = async function (fundId) {
            let allFundDetails = await fundContract.getAllFundDetails()
            for (let index = 0; index < allFundDetails.length; index++) {
                console.log(allFundDetails[index].fundId, fundId);
                if (allFundDetails[index].fundId == fundId) {
                    return index;
                }
            }

            throw new Error("fund not found");
        }

        // getFundByDetailsId is helper function to return fund details by its id.
        helperGetFundDetailsById = async function (fundId) {
            let fundIndex = await getFundIndexById(fundId)
            let allFundDetails = await fundContract.getAllFundDetails()
            return allFundDetails[fundIndex];
        }

        // createFund version of create fund function which return 
        // the fund id, by listening to the event.
        helperCreateFund = async function(...args) {
            const tx = await fundContract.createFund(...args);
            const receipt = await tx.wait();
            const event = receipt.events.find(event => event.event === 'FundCreated');
            console.log(event.args);
            let _, _, value = event.args;
            return event.fundId
        }

        fundContract.helperGetFundIndexById = helperGetFundIndexById;
        fundContract.helperGetFundDetailsById = helperGetFundDetailsById;
        fundContract.helperCreateFund = helperCreateFund;
        return fundContract;
    }
}