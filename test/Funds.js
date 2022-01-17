const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const { fundHelperWrapper, getHex, tokens, format } = require("./utils.js");

describe("Funds: NFT contract test", () => {
  let credentiaContract;
  let fundContract;
  let admin;
  let nftOwner1,
    nftOwner2,
    nftOwner3,
    nftOwner4,
    nftOwner5,
    nftOwner6,
    nftOwner7,
    nftOwner10;

  beforeEach(async () => {
    [
      admin,
      nftOwner1,
      nftOwner2,
      nftOwner3,
      nftOwner4,
      nftOwner5,
      nftOwner6,
      nftOwner7,
      ...nftOwner10
    ] = await ethers.getSigners();

    // Deploy nft factory smart contract
    let credentialFactory = await ethers.getContractFactory("Credentials");
    credentiaContract = await credentialFactory.deploy("ZAPIERFI", "ZAP");
    // Ensure that the event polling is happens faster
    credentiaContract.provider.pollingInterval = 100;

    // Deploy fund smart contract
    let fundFactory = await ethers.getContractFactory("Funds");
    fundContract = fundHelperWrapper(await fundFactory.deploy(credentiaContract.address));
    // Ensure that the event polling is happens faster
    fundContract.provider.pollingInterval = 100;

    // Create the nft credential
    await credentiaContract
      .connect(admin)
      .mintAnItem(
        nftOwner1.address,
        "https://ipfs.io/ipfs/bafybeibjxyehrtquuybuymgq5iuqll5nqgmqobmilt6fatbxtnpitxebt4/metadata_1.json",
        getHex("0x00010010")
      );

    
  });

  it("Verify owner 1 NFT", async () => {
    let owner = await credentiaContract.ownerOf(1);
    expect(owner).to.equal(nftOwner1.address);
  });

  it("Create A Fund and verify", async ()=>{

    await fundContract.createFund("ETHGLOBAL", "NFT HACKATHON WINNERS", tokens("0.5"), getHex("0x00010010"));
    let funddetails = await fundContract.getFundDetails();

    // TODO: substitute with check, remove console
    console.log(funddetails);

  })

  it.only("Get funding positive test case (NFT owner will get his ETH to his account)", async () => {
    let fundId = await fundContract.helperCreateFund(
      "ethglobal",
      "nft hackathon address",
      tokens("0.5"),
      getHex("0x00010010")
    );

    console.log(fundId);

    // let funddetails = await fundContract.getFundDetailsById(fundId);
    // expect(funddetails.fundId).to.equal(1);
    // expect(await provider.getBalance(admin.address)).to.equal(tokens("10000"))
    
    // let fundIndex = await fundContract.getFundIndexById(funddetails.fundId.value);
    // expect(fundIndex).to.equal(0);
    // await fundContract.depositFunds(fundIndex, { value: tokens("2") });

    // funddetails = await fundContract.getFundDetails();
    // // TODO: substitute with check, remove console
    // console.log(funddetails);

    // // TODO: substitute with check, remove console
    // console.log(
    //   "admin balance after deposit : ",
    //   format(await provider.getBalance(admin.address))
    // );
    
    // // TODO: substitute with check, remove console
    // console.log(
    //   "fund contract Balance before calling Evaluate NFT function : ",
    //   format(await provider.getBalance(fundContract.address))
    // );

    // let matchedFundTypes = await fundContract
    //   .connect(nftOwner1)
    //   .evaluavateNFTCredentials([1]);
    // console.log("matched fund types : ", matchedFundTypes);

    // // TODO: substitute with check, remove console
    // console.log(
    //   "fund contract Balance after executing Evaluate NFT function : ",
    //   format(await provider.getBalance(fundContract.address))
    // );

    // // TODO: substitute with check, remove console
    // console.log(
    //   "fund contract Balance before calling GetFunding method : ",
    //   format(await provider.getBalance(fundContract.address))
    // );

    // // TODO: substitute with check, remove console
    // console.log(
    //   "Nft owner Balance before calling GetFunding method : ",
    //   format(await provider.getBalance(nftOwner1.address))
    // );

    // await fundContract.connect(nftOwner1).getFunding(1, 1);
    
    // // TODO: substitute with check, remove console
    // console.log(
    //   "Nft owner Balance after calling GetFunding method : ",
    //   format(await provider.getBalance(nftOwner1.address))
    // );
    
    // // TODO: substitute with check, remove console
    // console.log(
    //   "fund contract Balance after executing GetFunding method: ",
    //   format(await provider.getBalance(fundContract.address))
    // );
  });

  it("Get Funding failure Test case (non NFT owner trying to call GetFunding method)", async () => {
    await fundContract.createFund(
      "ETHGLOBAL",
      "NFT HACKATHON WINNERS",
      tokens("0.5"),
      getHex("0x00010010")
    );

    let funddetails = await fundContract.getFundDetails();
    // TODO: substitute with check, remove console
    console.log(funddetails);

    // TODO: substitute with check, remove console
    expect(await provider.getBalance(admin.address)).to.equal(tokens("10000"));

    await fundContract.depositFunds(1, { value: tokens("2") });

    funddetails = await fundContract.getFundDetails();
    // TODO: substitute with check, remove console
    console.log(funddetails);

    // TODO: substitute with check, remove console
    console.log(
      "admin balance after deposit : ",
      format(await provider.getBalance(admin.address))
    );
    
    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance before calling Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    let matchedFundTypes = await fundContract
      .connect(nftOwner1)
      .evaluavateNFTCredentials([1]);

    // TODO: substitute with check, remove console
    console.log("matched fund types : ", matchedFundTypes);
    
    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance after executing Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );
    
    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance before calling GetFunding method : ",
      format(await provider.getBalance(fundContract.address))
    );
    
    // TODO: substitute with check, remove console
    console.log(
      "Nft owner Balance before calling GetFunding method : ",
      format(await provider.getBalance(nftOwner2.address))
    );
    try {
      await fundContract.connect(nftOwner2).getFunding(1, 1);
    } catch (ex) {
      console.error(ex.message);
    }
  
    // TODO: substitute with check, remove console
    console.log(
      "Nft owner Balance after calling GetFunding method : ",
      format(await provider.getBalance(nftOwner2.address))
    );
    
    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance after executing GetFunding method: ",
      format(await provider.getBalance(fundContract.address))
    );
  });

  it("Get Funding failure Test case(Already claimed NFT owner trying to call GetFunding method)", async () => {
    await fundContract.createFund(
      "ETHGLOBAL",
      "NFT HACKATHON WINNERS",
      tokens("0.5"),
      getHex("0x00010010")
    );

    let funddetails = await fundContract.getFundDetails();
    // TODO: substitute with check, remove console
    console.log(funddetails);
    
    // TODO: substitute with check, remove console
    console.log(
      "admin balance before deposit : ",
      format(await provider.getBalance(admin.address))
    );

    await fundContract.depositFunds(1, { value: tokens("2") });

    funddetails = await fundContract.getFundDetails();
    // TODO: substitute with check, remove console
    console.log(funddetails);
    
    // TODO: substitute with check, remove console
    console.log(
      "admin balance after deposit : ",
      format(await provider.getBalance(admin.address))
    );
    
    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance before calling Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    let matchedFundTypes = await fundContract
      .connect(nftOwner1)
      .evaluavateNFTCredentials([1]);
    
    // TODO: substitute with check, remove console
    console.log("matched fund types : ", matchedFundTypes);
    
    
    console.log(
      "fund contract Balance after executing Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance before calling GetFunding method : ",
      format(await provider.getBalance(fundContract.address))
    );

    // TODO: substitute with check, remove console
    console.log(
      "Nft owner Balance before calling GetFunding method : ",
      format(await provider.getBalance(nftOwner1.address))
    );

    await fundContract.connect(nftOwner1).getFunding(1, 1);
    
    // TODO: substitute with check, remove console
    console.log(
      "Nft owner Balance after calling GetFunding method : ",
      format(await provider.getBalance(nftOwner1.address))
    );
    
    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance after executing GetFunding method: ",
      format(await provider.getBalance(fundContract.address))
    );

    try {
      await fundContract.connect(nftOwner1).getFunding(1, 1);
    } catch (ex) {
      console.error(ex.message);
    }
  
    // TODO: substitute with check, remove console
    console.log(
      "Nft owner Balance after calling GetFunding method second time : ",
      format(await provider.getBalance(nftOwner1.address))
    );
    
    // TODO: substitute with check, remove console
    console.log(
      "fund contract Balance after executing GetFunding method second time: ",
      format(await provider.getBalance(fundContract.address))
    );
  });
});
