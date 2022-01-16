/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require("@nomiclabs/hardhat-waffle");


const RINKEBY_RPC_URL= 'https://rinkeby.infura.io/v3/3c0f5d523cc6404685b777cb62994527';
const PRIVATE_KEY = '5af283d5d90a73d73a77cfc71c77032131d92d52131914c7a80b10c2b5bd3f0d';

const GANACHE_RPC_URL = 'http://127.0.0.1:7545'
const GANACHE_ACCOUNT_PRIVATE_KEY = 'c96b964d69a1917153e9422b2e529c99f5e54bbdaba45e20e33a4155e6689746';

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
