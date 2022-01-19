const protobuf = require("protobufjs");
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;

describe("protobuf", async () => {
    it.only("decode/encode metadata", async () => {
        // Deploy trigger smart contract
        const factory = await ethers.getContractFactory("Trigger");
        const trigger = await factory.deploy();
        await trigger.deployed();

        // Ensure that the event polling is happens faster
        trigger.provider.pollingInterval = 100;

        const Category = {
            None: 0,
            DefiTools: 1,
            Nfts: 2,
            Dapps: 3,
        };

        const Message = new protobuf.Type("Message")
            .add(new protobuf.Field("winner", 1, "bool"))
            .add(new protobuf.Field("timestamp", 2, "uint32"))
            .add(new protobuf.Field("category", 3, "Category"))
            .add(new protobuf.Enum("Category", Category));

        const message = Message.create({ winner: true, timestamp: 1642409856, category: Category.DefiTools });
        const metadata = Message.encode(message).finish().toString("hex");

        console.log("metadata: ", "0x" + metadata);
        await trigger.callStatic.evaluate("0x" + metadata);
        
        // const result = await instance.decode_varint.call(1, "0x" + encoded);
        // const { 0: success, 1: pos, 2: val } = result;
        // assert.equal(success, true);
        // assert.equal(pos, 3);
        // assert.equal(val, 300);

        // await instance.decode_varint(1, "0x" + encoded);
    });
});
