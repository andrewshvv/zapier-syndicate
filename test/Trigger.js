const protobuf = require("protobufjs");
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;

describe("credential codec", async () => {
    it.only("decode/encode credential", async () => {
        // Deploy trigger smart contract
        const factory = await ethers.getContractFactory("Trigger");
        const trigger = await factory.deploy();
        await trigger.deployed();

        // Ensure that the event polling is happens faster
        trigger.provider.pollingInterval = 100;

        // const Category = {
        //     None: 0,
        //     DefiTools: 1,
        //     Nfts: 2,
        //     Dapps: 3,
        // };

        const Message = new protobuf.Type("Message")
            .add(new protobuf.Field("length", 1, "uint32"))
            .add(new protobuf.Field("winner", 2, "uint32"))
            .add(new protobuf.Field("place", 3, "uint32"))
            .add(new protobuf.Field("category", 4, "uint32"))

        const message = Message.create({ length: 3, winner: 501, place: 502, category: 503 });
        const metadata = Message.encode(message).finish().toString("hex");

        console.log("metadata: ", "0x" + metadata);
        // await trigger.callStatic.evaluate("0x" + metadata);

        // Duplication for gas estimation
        await trigger.evaluate("0x" + metadata);
    });

    it.only("credential array", async () => {
        // Deploy smart contract
        const factory = await ethers.getContractFactory("CredentialsArray");
        const credentialsArray = await factory.deploy();
        await credentialsArray.deployed();

        // Ensure that the event polling is happens faster
        credentialsArray.provider.pollingInterval = 100;

        await credentialsArray.add([501, 502, 503]);
    });

    it.only("credential bytes", async () => {
        // Deploy smart contract
        const factory = await ethers.getContractFactory("CredentialsBytes");
        const credentialsBytes = await factory.deploy();
        await credentialsBytes.deployed();

        // Ensure that the event polling is happens faster
        credentialsBytes.provider.pollingInterval = 100;

        await credentialsBytes.add("0x080310f50318f60320f703");
    });
});
