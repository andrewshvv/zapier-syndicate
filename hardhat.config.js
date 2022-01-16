/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require("@nomiclabs/hardhat-waffle");


const RINKEBY_RPC_URL= 'RPC url';
const PRIVATE_KEY = 'cbebdfb5afb15ee2bcd3f2fc53012d964aa739238a3b9c9138b0db1abb7d43df';

const GANACHE_RPC_URL = 'http://127.0.0.1:7545'
const GANACHE_ACCOUNT_PRIVATE_KEY = '8160dd995b65ff609e62c32a0d076ebad018e713122d9f39c5363dd778c28b35';

// const HARDHAT_RPC_URL = 'http://127.0.0.1:8545'
// const HARDHAT_ADMIN_ACCOUNT_PRIVATE_KEY = 'eac1ff929671f05330eb13281ab5398228f07be6c44fb24ebfd92b7aec541140';

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: [PRIVATE_KEY],
      //accounts: {
          //mnemonic: MNEMONIC,
      gas: 2100000,
      gasPrice: 8000000000,
      saveDeployments: true,
    },
    localhost: {
      url: GANACHE_RPC_URL,
      accounts: [GANACHE_ACCOUNT_PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 8000000000,
      saveDeployments: true,
    }
  }
};
