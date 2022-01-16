const fs = require('fs');
const path = require('path');
const Web3 = require("web3");

async function main() {
   // use main to capture the deployed contract address and then write to environment file located in .zapier-syndicate-web/src/environments/environment.ts 

      const NftFactory = await ethers.getContractFactory("NftFactoryV1");
      const NftFactoryDeployed = await NftFactory.deploy("ZappierFi", "ZAPPFI");

      const FundContract = await ethers.getContractFactory("FundContractV1");
      const FundContractDeployed = await FundContract.deploy(NftFactoryDeployed.address);

      await FundContractDeployed.deployed();
      console.log(" contract address Of NFTFactory : ", NftFactoryDeployed.address);

      console.log(" contract address Of FundContract : ", FundContractDeployed.address);


      const envFile = `
        export const environment = {
          production: false,
          fundContractInstance: '${FundContractDeployed.address}',
          nftFactoryInstance: '${NftFactoryDeployed.address}'
        };`
      ;

      // write the envFile address to environment.ts file.
      const webPath = path.join('.', 'zapier-syndicate-web', 'src');
      await fs.promises.writeFile(path.join(webPath, 'environments','environment.ts'), envFile);

      /* copy over the artifacts/contracts to asset folder in web. */
      const artifactPath = path.join('.', 'artifacts','contracts');
      const webAssetPath = path.join(webPath, 'assets');
      const contractsABI = await fs.promises.readdir(artifactPath);

      const copying = [];
      for(const folder of contractsABI) {
        if (!/\.sol$/.test(folder)) continue; 

        const contractABIName = folder.split('.').slice(0, -1).join('.') + '.json';
        copying.push(fs.promises.copyFile(
          path.join(artifactPath, folder, contractABIName),
          path.join(webAssetPath, contractABIName)
        ));
      }

      await Promise.all(copying);

      const url = "http://localhost:7545";
      const provider = new ethers.providers.JsonRpcProvider(url);

      // const nftFactory = artifacts.require('../contracts/NftFactoryV1.sol');
      // const fundContract = artifacts.require('../contracts/FundContractV1.sol');

      // nft = await nftFactory.new();
      // fund = await fundContract.new();

      //get ganache accounts
      const admin = provider.getSigner(0);
      const signer1 = provider.getSigner(1);
      const signer2 = provider.getSigner(2);
      const signer3 = provider.getSigner(3);
  

      // console.log(await NftFactoryDeployed.owner() );

      //add dummy data for NFT
      // await nft.addMinterRole(signer1.address);
      // await NftFactoryDeployed.connect(admin).addMinterRole(signer2);

      await NftFactoryDeployed.mintAnItem("0xDB97C62141eDA11999975E5B1Eb9B4a634fD0F07","https://ipfs.io/ipfs/bafybeibjxyehrtquuybuymgq5iuqll5nqgmqobmilt6fatbxtnpitxebt4/metadata_1.json",ethers.utils.arrayify("0x00010010"));
      await NftFactoryDeployed.mintAnItem("0xD9ff162B1D6e7590F834a26b00679bFA556E0055","https://ipfs.io/ipfs/bafybeibjxyehrtquuybuymgq5iuqll5nqgmqobmilt6fatbxtnpitxebt4/metadata_1.json",ethers.utils.arrayify("0x00010232"));

      // // added dummy data for Fund
      await FundContractDeployed.createFund("ETHGLOBAL", "NFT HACKATHON WINNERS", ethers.utils.parseEther("0.5"), ethers.utils.arrayify("0x00010010")).then((data)=>{
        console.log("created fund 1 by:");
      })
      await FundContractDeployed.createFund("ETHGLOBAL", "WEB3 HACKATHON WINNERS", ethers.utils.parseEther("0.2"), ethers.utils.arrayify("0x00010232")).then((data)=>{
        console.log("created fund 2 by:");
      })

      await FundContractDeployed.depositFund(1, { value: ethers.utils.parseEther("10") });
      await FundContractDeployed.depositFund(2, { value: ethers.utils.parseEther("5") });


      // await FundContractDeployed.getFundDetails().then((data)=>{
      //   console.log("all funds", data);
      // });
      
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });