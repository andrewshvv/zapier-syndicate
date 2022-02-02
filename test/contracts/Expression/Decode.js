const protobuf = require("protobufjs");
const {expect} = require("chai");
const {ethers} = require("hardhat");
const {pretty, enumerate} = require("../utils");
const path = require("path");

describe("Expression", async () => {
    let root, test;

    beforeEach(async () => {
        // Deploy test smart contract
        const factory = await ethers.getContractFactory("TestDecodeExpression");

        test = await factory.deploy();
        await test.deployed();

        // Ensure that the event polling is happens faster
        test.provider.pollingInterval = 100;

        let err;
        const protoFile = path.join(__dirname, "../../../src/protobuf/node.proto");
        err, root = await protobuf.load(protoFile);
        if (err) throw err;
    });

    it("encode/decode node with protobuf", async () => {
        // Obtain a message type
        let Node = root.lookupType("Node");
        let Opcode = root.lookupEnum("Opcode");
        Opcode = Opcode.parent.Opcode;

        const node = Node.create({
            opcode: Opcode.OPCODE_AND,
            leafs: [1, 2],
            arguments: [1]
        });

        const data = Node.encode(node).finish();
        let decoded = await test.callStatic.decodeNode(data);

        expect(decoded.opcode).to.be.equal(node.opcode);
        expect(decoded.leafs).to.be.deep.equal(node.leafs);
        expect(decoded.arguments).to.be.deep.equal(node.arguments);

        // Duplication for gas estimation
        await test.decodeNode(data);
    });

    it("encode/decode expression with protobuf", async () => {
        // Obtain a message type
        let Expression = root.lookupType("Expression");
        let Opcode = root.lookupEnum("Opcode");
        Opcode = Opcode.parent.Opcode;

        const expression = Expression.create({
            nodes: [{
                opcode: Opcode.OPCODE_AND,
                leafs: [1, 2],
                arguments: []
            },
                {
                    opcode: Opcode.OPCODE_CONST,
                    leafs: [3, 4],
                    arguments: [5]
                }]
        });

        const data = Expression.encode(expression).finish();
        let decoded = await test.callStatic.decodeExpression(data);

        // TODO: How to properly strip object and do deep equal?
        expect(decoded.nodes.length).to.be.equal(expression.nodes.length);
        expect(decoded.nodes[0].opcode).to.be.equal(expression.nodes[0].opcode);
        expect(decoded.nodes[0].leafs).to.be.deep.equal(expression.nodes[0].leafs);
        expect(decoded.nodes[0].arguments).to.be.deep.equal(expression.nodes[0].arguments);
        expect(decoded.nodes[1].opcode).to.be.equal(expression.nodes[1].opcode);
        expect(decoded.nodes[1].leafs).to.be.deep.equal(expression.nodes[1].leafs);
        expect(decoded.nodes[1].arguments).to.be.deep.equal(expression.nodes[1].arguments);

        // Duplication for gas estimation
        await test.decodeExpression(data);
    });

});