const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const {
  helperGetFundIndexById,
  helperGetFundDetailsById,
  helperCreateFund,
  helperMintAnItem,
  getHex, tokens, format } = require("./utils.js");

describe("Funds: NFT contract test", () => {
  let credentiaContract;
  let credentialId;
  let fundContract;
  let fundId, fundIndex;
  let fundingAmount;

  let admin;
  let hacker;
  let receiver;
  let depositor;

  beforeEach(async () => {
    [
      admin,
      hacker,
      receiver,
      depositor
    ] = await ethers.getSigners();

    // Deploy nft factory smart contract
    const credentialFactory = await ethers.getContractFactory("Credentials");
    credentiaContract = await credentialFactory.deploy("ZAPIERFI", "ZAP");

    // Ensure that the event polling is happens faster
    credentiaContract.provider.pollingInterval = 100;

    // Deploy fund smart contract
    const fundFactory = await ethers.getContractFactory("Funds");
    fundContract = await fundFactory.deploy(credentiaContract.address);

    // Ensure that the event polling is happens faster
    fundContract.provider.pollingInterval = 100;

    // Create the nft credential
    const metadata = getHex("0x00010010");
    const ipfsData = "https://ipfs.io/ipfs/bafybeibjxyehrtquuybuymgq5iuqll5nqgmqobmilt6fatbxtnpitxebt4/metadata_1.json";
    credentialId = await helperMintAnItem(credentiaContract.connect(admin),
      receiver.address,
      ipfsData,
      metadata
    );


    // Initialise fund
    fundingAmount = tokens("0.5");
    fundId = await helperCreateFund(fundContract,
      "name",
      "description",
      fundingAmount,
      metadata // TODO: should be credential type ids
    );

    // Initialise fund with some funds
    fundIndex = await helperGetFundIndexById(fundContract, fundId);
    await fundContract.connect(depositor).depositFunds(fundIndex, { value: fundingAmount.mul(4) });

  });

  it.only("Verify credential", async () => {
    // Check test context
    const owner = await credentiaContract.ownerOf(1);
    expect(owner).to.equal(receiver.address);
    expect(credentialId).to.equal(1);
  });

  it.only("Verify fund has been created", async () => {
    // Check test context
    const fundDetails = await helperGetFundDetailsById(fundContract, fundId);
    const fundIndex = await helperGetFundIndexById(fundContract, fundDetails.fundId);

    expect(fundDetails.fundId).to.equal(1);
    expect(fundDetails.name).to.equal("name");
    expect(fundDetails.description).to.equal("description");
    expect(fundDetails.currentBalance).to.equal(fundingAmount.mul(4));
    expect(fundDetails.fundingAmount).to.equal(fundingAmount);
    expect(fundIndex).to.equal(0);

    // TODO: check sender
    // TODO: check balance
    // TODO: check credentials types used

  })

  it.only("Verify funds being deposited", async () => {
    // Check test context
    const fundDetails = await helperGetFundDetailsById(fundContract, fundId);
    expect(fundDetails.currentBalance).to.equal(tokens("2"));
  })

  it.only("Verify nft owner eligable for funding", async () => {
    // Check test context
    let fundIds = await fundContract.connect(receiver).eligableFunds([1]);
    expect(fundIds).to.deep.equal([fundId]);
  });

  it.only("Get funding", async () => {
    // Fund contract balance before calling funding method
    const contractBalanceBefore = await provider.getBalance(fundContract.address);

    // Credential owner balance before calling funding method
    const receiverBalanceBefore = await provider.getBalance(receiver.address);

    const tx = await fundContract.connect(receiver).getFunding(credentialId, fundIndex);
    const receipt = await tx.wait();
    const fee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

    // Credential owner balance after calling funding method
    const receiverBalanceAfter = await provider.getBalance(receiver.address);
    const contractBalanceAfter = await provider.getBalance(fundContract.address);
    
    expect(receiverBalanceAfter).to.equal(receiverBalanceBefore.add(fundingAmount).sub(fee));
    expect(contractBalanceAfter).to.equal(contractBalanceBefore.sub(fundingAmount));
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
