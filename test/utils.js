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
}