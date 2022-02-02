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
    await fs.promises.writeFile(path.join(webPath, 'environments', 'environment.ts'), envFile);

    /* copy over the artifacts/contracts to asset folder in web. */
    const artifactPath = path.join('.', 'artifacts', 'contracts');
    const webAssetPath = path.join(webPath, 'assets');
    const contractsABI = await fs.promises.readdir(artifactPath);

    const copying = [];
    for (const folder of contractsABI) {
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

    await NftFactoryDeployed.mintAnItem("0xDa796b3C5cd8b4DbB2B1356886d0cCF353Cf5b85", "https://ipfs.io/ipfs/bafybeibjxyehrtquuybuymgq5iuqll5nqgmqobmilt6fatbxtnpitxebt4/metadata_1.json", ethers.utils.arrayify("0x00010010"));
    await NftFactoryDeployed.mintAnItem("0xD31D72172abF619350c473aafcc969E42A27E398", "https://ipfs.io/ipfs/bafybeibjxyehrtquuybuymgq5iuqll5nqgmqobmilt6fatbxtnpitxebt4/metadata_1.json", ethers.utils.arrayify("0x00030232"));

    // // added dummy data for Fund
    await FundContractDeployed.createFund("DAO Rabbit: Grant for solidity developers", "Grant for work on DAO RABBIT outstanding open-source github issues for ethglobal hackathon participants with solidity development skills.", ethers.utils.parseEther("0.5"), ethers.utils.arrayify("0x00010010")).then((data) => {
        console.log("created fund 1 by:");
    })
    await FundContractDeployed.createFund("EthGlobal Participants", "Web3 hackers who are participated in EthGlobal hackathon, can avail from the deposited funds. Skill set inclusive of : Front End development Angular/React/Vue with web3.js ether.js", ethers.utils.parseEther("0.5"), ethers.utils.arrayify("0x00030232")).then((data) => {
        console.log("created fund 2 by:");
    })

    await FundContractDeployed.createFund("EthGlobal Participants(Product owners)", "Web3 Product Owners who are participated in EthGlobal hackathon, can avail from the deposited funds. Skill set inclusive of : Product Management, Product Execution and Delivery ", ethers.utils.parseEther("0.4"), ethers.utils.arrayify("0x00020232")).then((data) => {
        console.log("created fund 3 by:");
    })

    await FundContractDeployed.depositFund(1, {value: ethers.utils.parseEther("10")});
    await FundContractDeployed.depositFund(2, {value: ethers.utils.parseEther("8")});
    await FundContractDeployed.depositFund(3, {value: ethers.utils.parseEther("7")});


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
