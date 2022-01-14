const { expect } = require("chai");
const { ethers } = require("hardhat")

const getHex = (hex)=>{
    let byteArray = ethers.utils.arrayify(hex);
    //console.log("bytearray : ", byteArray);
    return byteArray;
}
describe('NFT Contract Pausable Test', () =>{
    let NFT, owner,addr1,addr2,addr3,addrs, deployedNFT

    beforeEach(async () => {
        NFT = await ethers.getContractFactory("NftFactoryV1");
        [owner, addr1, addr2,addr3, ...addrs] = await ethers.getSigners();
        let _name = 'CREDENTIAL'
        let _symbol = "CRT"
        deployedNFT = await NFT.connect(owner).deploy(_name,_symbol);

    })

    it('Should Mint By Owner', async () => {
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010"))
    })

    it('Should  Mint when Paused By owner', async() => {
        await deployedNFT.connect(owner).pause()
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010232"))
    })

    it('Should mint by persons having minter role', async() => {
        await deployedNFT.addMinterRole(addr1.address)
        await deployedNFT.addMinterRole(addr2.address)

        await deployedNFT.connect(addr1).mintAnItem(addr1.address,"",getHex("0x01040010"))
        await deployedNFT.connect(addr2).mintAnItem(addr2.address,"",getHex("0x01040122"))
    })

    it('Should mint when  minter role for some', async() => {
        await deployedNFT.connect(owner).pause()
        await deployedNFT.addMinterRole(addr1.address)
        await deployedNFT.addMinterRole(addr2.address)
        await deployedNFT.connect(addr1).mintAnItem(addr1.address,"",getHex("0x01040010"))
    })

    it('Should not mint when a person doesnt have minter role', async() => {
        await deployedNFT.addMinterRole(addr1.address)
        await deployedNFT.connect(addr1).mintAnItem(addr1.address,"",getHex("0x01040010"))
        await deployedNFT.removeMinterRole(addr1.address)
        await expect(deployedNFT.connect(addr1).mintAnItem(addr1.address,"",getHex("0x01040230"))).to.be.revertedWith("Sorry you dont have minter role")
    })

    it('Should not tranfer when paused except  for owner and minters', async() => {
        
        await deployedNFT.addMinterRole(addr1.address) 
        await deployedNFT.addMinterRole(addr2.address)
        var tx = await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x01040230")) //id: 1
        // var rc = await tx.wait()
        // var event1 = rc.events.find(event => event.event == 'Transfer')
        // console.log(event1.args)
        await deployedNFT.connect(addr1).mintAnItem(addr1.address,"",getHex("0x01040230")) //id:2
        await deployedNFT.connect(addr2).mintAnItem(addr3.address,"",getHex("0x01040230")) //id:3

        await deployedNFT.connect(owner).pause()

        //await deployedNFT.connect(owner).transferFrom(owner.address,addr1.address,1)
        await expect(deployedNFT.connect(addr3).transferFrom(addr3.address, addr2.address, 3)).to.be.revertedWith("Only the Owner can Transfer or Mint until pause")
    })

    it('Should transfer when unpaused', async() => {
          
        await deployedNFT.addMinterRole(addr1.address) 
        await deployedNFT.addMinterRole(addr2.address)
        var tx = await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x01040230")) //id: 1
        // var rc = await tx.wait()
        // var event1 = rc.events.find(event => event.event == 'Transfer')
        // console.log(event1.args)
        await deployedNFT.connect(addr1).mintAnItem(addr1.address,"",getHex("0x01040230")) //id:2
        await deployedNFT.connect(addr2).mintAnItem(addr3.address,"",getHex("0x01040230")) //id:3
        await deployedNFT.connect(owner).pause()
        await expect(deployedNFT.connect(addr3).transferFrom(addr3.address, addr2.address, 3)).to.be.revertedWith("Only the Owner can Transfer or Mint until pause")
        await deployedNFT.connect(owner).unPause()
        await deployedNFT.connect(addr3).transferFrom(addr3.address, addr2.address, 3)
    })
})


describe('NFT Contract Test', () =>{
    let NFT, owner,addr1,addr2,addr3,addrs, deployedNFT

    beforeEach(async () => {
        NFT = await ethers.getContractFactory("NftFactoryV1");
        [owner, addr1, addr2,addr3, ...addrs] = await ethers.getSigners();
        let _name = 'CREDENTIAL'
        let _symbol = "CRT"
        deployedNFT = await NFT.connect(owner).deploy(_name,_symbol);

    })
    
    it('Should mint by owner', async() => {
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010"))    
    })

    it('Should have correct identifier for a token', async() =>{
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010"))  //id:1
        let identifier1= await deployedNFT.connect(owner).getIdentifiers(1)   
        console.log(identifier1)
        expect(identifier1).to.equal("0x00010010")

        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010121"))  //id:2
        let identifier2= await deployedNFT.connect(owner).getIdentifiers(2)   
        console.log(identifier2)
        expect(identifier2).to.equal("0x00010121")


        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010232"))  //id:3
        let identifier3= await deployedNFT.connect(owner).getIdentifiers(3)   
        console.log(identifier3)
        expect(identifier3).to.equal("0x00010232")


        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x01040122"))  //id:
        let identifier4= await deployedNFT.connect(owner).getIdentifiers(4)   
        console.log(identifier4)
        expect(identifier4).to.equal("0x01040122")
    })

    // it('Should get correct owner of an NFT', async() =>{

    //     await deployedNFT.addMinterRole(addr1.address)
    //     await deployedNFT.addMinterRole(addr2.address)

    //     await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010")) 
    //     let owner1 = await deployedNFT.getOwner(1)
    //     expect(owner1).to.equal(owner.address)

    //     await deployedNFT.connect(addr1).mintAnItem(addr1.address,"",getHex("0x00010010")) 
    //     let owner2 = await deployedNFT.getOwner(2)
    //     expect(owner2).to.equal(addr1.address)

    //     await deployedNFT.connect(addr2).mintAnItem(addr2.address,"",getHex("0x00010010")) 
    //     let owner3 = await deployedNFT.getOwner(3)
    //     expect(owner3).to.equal(addr2.address)

        
    // })

    it('Should get tokens of Owner', async() => {
        await deployedNFT.addMinterRole(addr1.address)
        await deployedNFT.addMinterRole(addr2.address)
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010")) //1
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010")) //2
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010")) //3
        await deployedNFT.connect(owner).mintAnItem(addr1.address,"",getHex("0x00010010")) //4
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010")) //5
        await deployedNFT.connect(owner).mintAnItem(addr2.address,"",getHex("0x00010010")) //6
        await deployedNFT.connect(owner).mintAnItem(addr1.address,"",getHex("0x00010010")) //7
        await deployedNFT.connect(owner).mintAnItem(addr2.address,"",getHex("0x00010010")) //8
        
        
        console.log("first address tokens -->",await deployedNFT.getCredentials(owner.address))
        console.log("second address tokens -->",await deployedNFT.getCredentials(addr1.address))
        console.log("third address tokens -->",await deployedNFT.getCredentials(addr2.address))
    
    })

    // it("Get address of the founding team who won NFT hackathon from ethglobal", async ()=>{
    //     await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010"))  //id:1
    //     await deployedNFT.connect(owner).mintAnItem(addr1.address,"",getHex("0x00010121"))  //id:2
    //     await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010232"))  //id:3
    //     await deployedNFT.connect(owner).mintAnItem(addr2.address,"",getHex("0x01040122"))  //id:4




    //     //Ethglobal,Nfthackevent,Defi category, first place , no seeed
    //     let matchedAddress = await deployedNFT.getMatchedAddress(getHex("0x00010010"));
    //     expect(matchedAddress).to.equal(owner.address);

    //     let matchedAddress2 = await deployedNFT.getMatchedAddress(getHex("0x00010121"));
    //     expect(matchedAddress2).to.equal(addr1.address);

    //     let matchedAddress3 = await deployedNFT.getMatchedAddress(getHex("0x00010232"));
    //     expect(matchedAddress3).to.equal(owner.address);

    //     let matchedAddress4 = await deployedNFT.getMatchedAddress(getHex("0x01040122"));
    //     expect(matchedAddress4).to.equal(addr2.address);
    // })

    it("Match tokens of users with identifiers", async() => {
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010010"))  //id:1
        await deployedNFT.connect(owner).mintAnItem(addr1.address,"",getHex("0x00010121"))  //id:2
        await deployedNFT.connect(owner).mintAnItem(owner.address,"",getHex("0x00010232"))  //id:3
        await deployedNFT.connect(owner).mintAnItem(addr2.address,"",getHex("0x01040122"))  //id:4

        let tokensOfOwner1 = await deployedNFT.getCredentials(owner.address)
        expect(await deployedNFT.getIdentifiers(tokensOfOwner1[0])).to.be.equal("0x00010010") //id:1
        expect(await deployedNFT.getIdentifiers(tokensOfOwner1[1])).to.be.equal("0x00010232") //id:3

        let tokensOfOwner2 = await deployedNFT.getCredentials(addr1.address)
        expect(await deployedNFT.getIdentifiers(tokensOfOwner2[0])).to.be.equal("0x00010121") //id:1
    })

  }
)