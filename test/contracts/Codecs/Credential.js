const protobuf = require("protobufjs");
const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("CredentialCodec", async () => {
    it("decode/encode credential", async () => {
        // Deploy codec library smart contract
        const factory = await ethers.getContractFactory("CredentialCodec");
        const codec = await factory.deploy();
        await codec.deployed();

        // Ensure that the event polling is happens faster
        codec.provider.pollingInterval = 100;

        const Message = new protobuf.Type("Message")
            .add(new parotobuf.Field("length", 1, "uint32"))
            .add(new protobuf.Field("winner", 2, "uint32"))
            .add(new protobuf.Field("place", 3, "uint32"))
            .add(new protobuf.Field("category", 4, "uint32"))

        const message = Message.create({length: 3, winner: 501, place: 502, category: 503});
        const metadata = Message.encode(message).finish();
        const metadataHex = "0x" + metadata.toString("hex");

        let [, , values] = await codec.callStatic.decode(0, metadata, metadata.length);
        expect(values[0]).to.be.equal(501);
        expect(values[1]).to.be.equal(502);
        expect(values[2]).to.be.equal(503);
        expect(metadataHex).to.be.equal("0x080310f50318f60320f703");

        // Duplication for gas estimation
        await codec.decode(0, metadata, metadata.length);
    });


});
