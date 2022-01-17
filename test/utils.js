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
        getFundIndexById = async function (fundId) {
            let allFundDetails = await fundContract.getAllFundDetails()
            for (let index = 0; index < allFundDetails.length; index++) {
                if (allFundDetails[index].fundId.toNumber()  == fundId.toNumber()) {
                    return index;
                }
            }

            throw new Error("fund not found");
        }

        // getFundByDetailsId is helper function to return fund details by its id.
        getFundDetailsById = async function (fundId) {
            let fundIndex = await getFundIndexById(fundId)
            let allFundDetails = await fundContract.getAllFundDetails()
            return allFundDetails[fundIndex];
        }

        // createFund version of create fund function which return 
        // the fund id, by listening to the event.
        createFund = async function(...args) {
            const tx = await fundContract.createFund(...args);
            const receipt = await tx.wait();
            const event = receipt.events.find(event => event.event === 'FundCreated');
            return event.args['fundId']
        }

        fundContract.helperGetFundIndexById = getFundIndexById;
        fundContract.helperGetFundDetailsById = getFundDetailsById;
        fundContract.helperCreateFund = createFund;
        return fundContract;
    }
}