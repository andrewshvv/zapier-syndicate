const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;

const getHex = (hex) => {
  let byteArray = ethers.utils.arrayify(hex);
  //console.log("bytearray : ", byteArray);
  return byteArray;
};

const tokens = (val) => {
  return ethers.utils.parseEther(val);
};

function format(n) {
  return ethers.utils.formatEther(n);
}

describe("NFT Contract Test", () => {
  let nftContract;
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

    let zapiSmartContract = await ethers.getContractFactory("NftFactoryV1");

    nftContract = await zapiSmartContract.deploy("ZAPIERFI", "ZAP");

    //Ethglobal,Nfthackevent,Defi category, first place , no seeed
    await nftContract
      .connect(admin)
      .mintAnItem(
        nftOwner1.address,
        "https://ipfs.io/ipfs/bafybeibjxyehrtquuybuymgq5iuqll5nqgmqobmilt6fatbxtnpitxebt4/metadata_1.json",
        getHex("0x00010010")
      );

    let fundSmartContract = await ethers.getContractFactory("FundContractV1");

    fundContract = await fundSmartContract.deploy(nftContract.address);
  });

  it("Verify owner 1 NFT", async () => {
    let owner = await nftContract.ownerOf(1);
    expect(owner).to.equal(nftOwner1.address);
  });

  it("Create A Fund and verify", async ()=>{

    await fundContract.createFund("ETHGLOBAL", "NFT HACKATHON WINNERS", tokens("0.5"), getHex("0x00010010"));

    let funddetails = await fundContract.getFundetails();
    console.log(funddetails);

  })

  it("Get Funding Positive Test case(NFT owner will get his ETH to his account)", async () => {
    await fundContract.createFund(
      "ETHGLOBAL",
      "NFT HACKATHON WINNERS",
      tokens("0.5"),
      getHex("0x00010010")
    );

    let funddetails = await fundContract.getFundetails();
    console.log(funddetails);

    console.log(
      "admin balance before deposit : ",
      format(await provider.getBalance(admin.address))
    );

    await fundContract.depositFund(1, { value: tokens("2") });

    funddetails = await fundContract.getFundetails();
    console.log(funddetails);

    console.log(
      "admin balance after deposit : ",
      format(await provider.getBalance(admin.address))
    );

    console.log(
      "fund contract Balance before calling Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    let matchedFundTypes = await fundContract
      .connect(nftOwner1)
      .evaluavateNFTCredentials([1]);
    console.log("matched fund types : ", matchedFundTypes);

    console.log(
      "fund contract Balance after executing Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    console.log(
      "fund contract Balance before calling GetFunding method : ",
      format(await provider.getBalance(fundContract.address))
    );

    console.log(
      "Nft owner Balance before calling GetFunding method : ",
      format(await provider.getBalance(nftOwner1.address))
    );

    await fundContract.connect(nftOwner1).getFunding(1, 1);

    console.log(
      "Nft owner Balance after calling GetFunding method : ",
      format(await provider.getBalance(nftOwner1.address))
    );

    console.log(
      "fund contract Balance after executing GetFunding method: ",
      format(await provider.getBalance(fundContract.address))
    );
  });

  it("Get Funding failure Test case(non NFT owner trying to call GetFunding method)", async () => {
    await fundContract.createFund(
      "ETHGLOBAL",
      "NFT HACKATHON WINNERS",
      tokens("0.5"),
      getHex("0x00010010")
    );

    let funddetails = await fundContract.getFundetails();
    console.log(funddetails);

    console.log(
      "admin balance before deposit : ",
      format(await provider.getBalance(admin.address))
    );

    await fundContract.depositFund(1, { value: tokens("2") });

    funddetails = await fundContract.getFundetails();
    console.log(funddetails);

    console.log(
      "admin balance after deposit : ",
      format(await provider.getBalance(admin.address))
    );

    console.log(
      "fund contract Balance before calling Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    let matchedFundTypes = await fundContract
      .connect(nftOwner1)
      .evaluavateNFTCredentials([1]);
    console.log("matched fund types : ", matchedFundTypes);

    console.log(
      "fund contract Balance after executing Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    console.log(
      "fund contract Balance before calling GetFunding method : ",
      format(await provider.getBalance(fundContract.address))
    );

    console.log(
      "Nft owner Balance before calling GetFunding method : ",
      format(await provider.getBalance(nftOwner2.address))
    );
    try {
      await fundContract.connect(nftOwner2).getFunding(1, 1);
    } catch (ex) {
      console.error(ex.message);
    }

    console.log(
      "Nft owner Balance after calling GetFunding method : ",
      format(await provider.getBalance(nftOwner2.address))
    );

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

    let funddetails = await fundContract.getFundetails();
    console.log(funddetails);

    console.log(
      "admin balance before deposit : ",
      format(await provider.getBalance(admin.address))
    );

    await fundContract.depositFund(1, { value: tokens("2") });

    funddetails = await fundContract.getFundetails();
    console.log(funddetails);

    console.log(
      "admin balance after deposit : ",
      format(await provider.getBalance(admin.address))
    );

    console.log(
      "fund contract Balance before calling Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    let matchedFundTypes = await fundContract
      .connect(nftOwner1)
      .evaluavateNFTCredentials([1]);
    console.log("matched fund types : ", matchedFundTypes);

    console.log(
      "fund contract Balance after executing Evaluate NFT function : ",
      format(await provider.getBalance(fundContract.address))
    );

    console.log(
      "fund contract Balance before calling GetFunding method : ",
      format(await provider.getBalance(fundContract.address))
    );

    console.log(
      "Nft owner Balance before calling GetFunding method : ",
      format(await provider.getBalance(nftOwner1.address))
    );

    await fundContract.connect(nftOwner1).getFunding(1, 1);

    console.log(
      "Nft owner Balance after calling GetFunding method : ",
      format(await provider.getBalance(nftOwner1.address))
    );

    console.log(
      "fund contract Balance after executing GetFunding method: ",
      format(await provider.getBalance(fundContract.address))
    );

    try {
      await fundContract.connect(nftOwner1).getFunding(1, 1);
    } catch (ex) {
      console.error(ex.message);
    }

    console.log(
      "Nft owner Balance after calling GetFunding method second time : ",
      format(await provider.getBalance(nftOwner1.address))
    );

    console.log(
      "fund contract Balance after executing GetFunding method second time: ",
      format(await provider.getBalance(fundContract.address))
    );
  });
});
