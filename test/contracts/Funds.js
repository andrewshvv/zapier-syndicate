const {expect} = require("chai");
const {ethers, waffle} = require("hardhat");
const provider = waffle.provider;
const {
    helperGetFundIndexById,
    helperGetFundDetailsById,
    helperCreateFund,
    helperMintAnItem,
    getHex, tokens
} = require("./utils.js");

describe("Funds contract tests", () => {
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
        await fundContract.connect(depositor).depositFunds(fundIndex, {value: fundingAmount.mul(4)});

    });

    it("Verify credential", async () => {
        // Check test context
        const owner = await credentiaContract.ownerOf(1);
        expect(owner).to.equal(receiver.address);
        expect(credentialId).to.equal(1);
    });

    it("Verify fund has been created", async () => {
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

    it("Verify funds being deposited", async () => {
        // Check test context
        const fundDetails = await helperGetFundDetailsById(fundContract, fundId);
        expect(fundDetails.currentBalance).to.equal(tokens("2"));
    })

    it("Verify nft owner eligable for funding", async () => {
        // Check test context
        let fundIds = await fundContract.connect(receiver).eligableFunds([1]);
        expect(fundIds).to.deep.equal([fundId]);
    });

    it("Get funding", async () => {
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

    it("Get funding failure: non credential owner trying to get funds", async () => {
        // Fund contract balance before calling funding method
        const contractBalanceBefore = await provider.getBalance(fundContract.address);

        // Hacker balance before calling funding method
        const hackerBalanceBefore = await provider.getBalance(hacker.address);

        await expect(fundContract.connect(hacker).getFunding(credentialId, fundIndex))
            .to.be.revertedWith("credentails isn't owned by sender");

        // Hacker balance after calling funding method
        const hackerBalanceAfter = await provider.getBalance(hacker.address);
        const contractBalanceAfter = await provider.getBalance(fundContract.address);

        expect(contractBalanceAfter).to.equal(contractBalanceBefore);

        // TODO: How to get fee of reverted transaction?
        // const receipt = await tx.wait();
        // const fee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        // expect(hackerBalanceAfter).to.equal(hackerBalanceBefore.sub(fee));
    });

    it("Get funding failure: double spend", async () => {
        // Fund contract balance before calling funding method
        const contractBalanceBefore = await provider.getBalance(fundContract.address);

        // Credential owner balance before calling funding method
        const receiverBalanceBefore = await provider.getBalance(receiver.address);

        const tx = await fundContract.connect(receiver).getFunding(credentialId, fundIndex);
        const receipt = await tx.wait();
        const fee = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

        // Credential balance after calling funding method
        const receiverBalanceAfter = await provider.getBalance(receiver.address);
        const contractBalanceAfter = await provider.getBalance(fundContract.address);

        expect(receiverBalanceAfter).to.equal(receiverBalanceBefore.add(fundingAmount).sub(fee));
        expect(contractBalanceAfter).to.equal(contractBalanceBefore.sub(fundingAmount));

        await expect(fundContract.connect(receiver).getFunding(credentialId, fundIndex))
            .to.be.revertedWith("already withdrawn for this fund");

        expect(receiverBalanceAfter).to.equal(receiverBalanceBefore.add(fundingAmount).sub(fee));
        expect(contractBalanceAfter).to.equal(contractBalanceBefore.sub(fundingAmount));
    });
});
