

async function main() {
   // use main to capture the deployed contract address and then write to environment file located in .zapier-syndicate-web/src/environments/environment.ts 

      const NftFactory = await ethers.getContractFactory("NftFactoryV1");
      const NftFactoryDeployed = await NftFactory.deploy("ZappierFi", "ZAPPFI");

      const FundContract = await ethers.getContractFactory("FundContractV1");
      const FundContractDeployed = await FundContract.deploy(NftFactoryDeployed.address);

      console.log(" contract address Of NFTFactory : ", NftFactoryDeployed.address);

      console.log(" contract address Of FundContract : ", FundContractDeployed.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });