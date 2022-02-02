// TODO: Add local function for constructing the value array, iterate over the protobuf or contract it manually?
// TODO: Use parser library?


const {expect} = require("chai");
const {ethers} = require("hardhat");
const {ExpressionParser} = require("../../../src/parser");

describe("Evaluator", async () => {
    let test;

    beforeEach(async () => {
        let factory = await ethers.getContractFactory("Evaluator");
        const evaluator = await factory.deploy();
        await evaluator.deployed();

        // Deploy test smart contract
        factory = await ethers.getContractFactory("TestEvaluateExpression", {
            libraries: {
                "Evaluator": evaluator.address,
            }
        });
        test = await factory.deploy();
        await test.deployed();
    });

    it.only("evaluate expression", async () => {
        const parser = new ExpressionParser(true, false);
        let expression = {
            nodes: parser.parse("1 == 2")
        };

        await test.init(expression, []);
        let res = await test.callStatic.evaluate();
        expect(res).to.equal(false);
    });
});