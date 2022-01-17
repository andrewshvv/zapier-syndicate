const { expect } = require("chai");
const { ethers } = require("hardhat")
const { getHex } = require("./utils.js");

describe('NFT Contract Pausable Test', () => {
    let credentialsFactory, owner, addr1, addr2, addr3, addrs, credentialsContract
    let metadata = getHex("0x00010010");

    beforeEach(async () => {
        credentialsFactory = await ethers.getContractFactory("Credentials");
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        let _name = 'CREDENTIAL'
        let _symbol = "CRT"
        credentialsContract = await credentialsFactory.connect(owner).deploy(_name, _symbol);

    })

    it('Should mint By Owner', async () => {
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", metadata)
    })

    it('Should mint when Paused by owner', async () => {
        await credentialsContract.connect(owner).pause()
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", metadata)
    })

    it('Should mint by persons having minter role', async () => {
        await credentialsContract.addMinterRole(addr1.address)
        await credentialsContract.addMinterRole(addr2.address)

        await credentialsContract.connect(addr1).mintAnItem(addr1.address, "", metadata)
        await credentialsContract.connect(addr2).mintAnItem(addr2.address, "", metadata)
    })

    it('Should mint when  minter role for some', async () => {
        await credentialsContract.connect(owner).pause()
        await credentialsContract.addMinterRole(addr1.address)
        await credentialsContract.addMinterRole(addr2.address)
        await credentialsContract.connect(addr1).mintAnItem(addr1.address, "", metadata)
    })

    it('Should not mint when a person doesnt have minter role', async () => {
        await credentialsContract.addMinterRole(addr1.address)
        await credentialsContract.connect(addr1).mintAnItem(addr1.address, "", metadata)
        await credentialsContract.removeMinterRole(addr1.address)
        await expect(credentialsContract.connect(addr1).mintAnItem(addr1.address, "", metadata))
            .to
            .be
            .revertedWith("permission denied")
    })

    it('Should not tranfer when paused except for owner and minters', async () => {
        await credentialsContract.addMinterRole(addr1.address)
        await credentialsContract.addMinterRole(addr2.address)
        var tx = await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x01040230")) //id: 1
        // var rc = await tx.wait()
        // var event1 = rc.events.find(event => event.event == 'Transfer')
        // console.log(event1.args)
        await credentialsContract.connect(addr1).mintAnItem(addr1.address, "", getHex("0x01040230")) //id:2
        await credentialsContract.connect(addr2).mintAnItem(addr3.address, "", getHex("0x01040230")) //id:3

        await credentialsContract.connect(owner).pause()

        //await credentialsContract.connect(owner).transferFrom(owner.address,addr1.address,1)
        await expect(credentialsContract.connect(addr3).transferFrom(addr3.address, addr2.address, 3)).to.be.revertedWith("Only the Owner can Transfer or Mint until pause")
    })

    it('Should transfer when unpaused', async () => {

        await credentialsContract.addMinterRole(addr1.address)
        await credentialsContract.addMinterRole(addr2.address)
        var tx = await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x01040230")) //id: 1
        // var rc = await tx.wait()
        // var event1 = rc.events.find(event => event.event == 'Transfer')
        // console.log(event1.args)
        await credentialsContract.connect(addr1).mintAnItem(addr1.address, "", getHex("0x01040230")) //id:2
        await credentialsContract.connect(addr2).mintAnItem(addr3.address, "", getHex("0x01040230")) //id:3
        await credentialsContract.connect(owner).pause()
        await expect(credentialsContract.connect(addr3).transferFrom(addr3.address, addr2.address, 3)).to.be.revertedWith("Only the Owner can Transfer or Mint until pause")
        await credentialsContract.connect(owner).unPause()
        await credentialsContract.connect(addr3).transferFrom(addr3.address, addr2.address, 3)
    })
})


describe('NFT Contract Test', () => {
    let credentialsFactory, owner, addr1, addr2, addr3, addrs, credentialsContract

    beforeEach(async () => {
        credentialsFactory = await ethers.getContractFactory("Credentials");
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        let _name = 'CREDENTIAL'
        let _symbol = "CRT"
        credentialsContract = await credentialsFactory.connect(owner).deploy(_name, _symbol);

    })

    it('Should mint by owner', async () => {
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010010"))
    })

    it('Should have correct identifier for a token', async () => {
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010010"))  //id:1
        let identifier1 = await credentialsContract.connect(owner).getIdentifiers(1)
        expect(identifier1).to.equal("0x00010010")

        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010121"))  //id:2
        let identifier2 = await credentialsContract.connect(owner).getIdentifiers(2)
        expect(identifier2).to.equal("0x00010121")


        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010232"))  //id:3
        let identifier3 = await credentialsContract.connect(owner).getIdentifiers(3)
        expect(identifier3).to.equal("0x00010232")


        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x01040122"))  //id:
        let identifier4 = await credentialsContract.connect(owner).getIdentifiers(4)
        expect(identifier4).to.equal("0x01040122")
    })

    // it('Should get correct owner of an NFT', async() =>{

    //     await credentialsContract.addMinterRole(addr1.address)
    //     await credentialsContract.addMinterRole(addr2.address)

    //     await credentialsContract.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010")) 
    //     let owner1 = await credentialsContract.getOwner(1)
    //     expect(owner1).to.equal(owner.address)

    //     await credentialsContract.connect(addr1).mintAnItem(addr1.address,"",getHex("0x00010010")) 
    //     let owner2 = await credentialsContract.getOwner(2)
    //     expect(owner2).to.equal(addr1.address)

    //     await credentialsContract.connect(addr2).mintAnItem(addr2.address,"",getHex("0x00010010")) 
    //     let owner3 = await credentialsContract.getOwner(3)
    //     expect(owner3).to.equal(addr2.address)


    // })

    it('Should get tokens of Owner', async () => {
        await credentialsContract.addMinterRole(addr1.address)
        await credentialsContract.addMinterRole(addr2.address)
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010010")) //1
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010010")) //2
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010010")) //3
        await credentialsContract.connect(owner).mintAnItem(addr1.address, "", getHex("0x00010010")) //4
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010010")) //5
        await credentialsContract.connect(owner).mintAnItem(addr2.address, "", getHex("0x00010010")) //6
        await credentialsContract.connect(owner).mintAnItem(addr1.address, "", getHex("0x00010010")) //7
        await credentialsContract.connect(owner).mintAnItem(addr2.address, "", getHex("0x00010010")) //8

        
        // TODO: substitute with check, remove console
        console.log("first address tokens -->", await credentialsContract.getCredentials(owner.address))
        // TODO: substitute with check, remove console
        console.log("second address tokens -->", await credentialsContract.getCredentials(addr1.address))
        // TODO: substitute with check, remove console
        console.log("third address tokens -->", await credentialsContract.getCredentials(addr2.address))

    })

    // it("Get address of the founding team who won NFT hackathon from ethglobal", async ()=>{
    //     await credentialsContract.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010"))  //id:1
    //     await credentialsContract.connect(owner).mintAnItem(addr1.address,"",getHex("0x00010121"))  //id:2
    //     await credentialsContract.connect(owner).mintAnItem(owner.address,"",getHex("0x00010232"))  //id:3
    //     await credentialsContract.connect(owner).mintAnItem(addr2.address,"",getHex("0x01040122"))  //id:4




    //     //Ethglobal,Nfthackevent,Defi category, first place , no seeed
    //     let matchedAddress = await credentialsContract.getMatchedAddress(getHex("0x00010010"));
    //     expect(matchedAddress).to.equal(owner.address);

    //     let matchedAddress2 = await credentialsContract.getMatchedAddress(getHex("0x00010121"));
    //     expect(matchedAddress2).to.equal(addr1.address);

    //     let matchedAddress3 = await credentialsContract.getMatchedAddress(getHex("0x00010232"));
    //     expect(matchedAddress3).to.equal(owner.address);

    //     let matchedAddress4 = await credentialsContract.getMatchedAddress(getHex("0x01040122"));
    //     expect(matchedAddress4).to.equal(addr2.address);
    // })

    it("Match tokens of users with identifiers", async () => {
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010010"))  //id:1
        await credentialsContract.connect(owner).mintAnItem(addr1.address, "", getHex("0x00010121"))  //id:2
        await credentialsContract.connect(owner).mintAnItem(owner.address, "", getHex("0x00010232"))  //id:3
        await credentialsContract.connect(owner).mintAnItem(addr2.address, "", getHex("0x01040122"))  //id:4

        let tokensOfOwner1 = await credentialsContract.getCredentials(owner.address)
        expect(await credentialsContract.getIdentifiers(tokensOfOwner1[0])).to.be.equal("0x00010010") //id:1
        expect(await credentialsContract.getIdentifiers(tokensOfOwner1[1])).to.be.equal("0x00010232") //id:3

        let tokensOfOwner2 = await credentialsContract.getCredentials(addr1.address)
        expect(await credentialsContract.getIdentifiers(tokensOfOwner2[0])).to.be.equal("0x00010121") //id:1
    })

}
)