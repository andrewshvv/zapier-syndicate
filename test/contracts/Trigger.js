const protobuf = require("protobufjs");
const {expect} = require("chai");
const {ethers, waffle} = require("hardhat");
const {getHex, deployAllContracts} = require("./utils");

// TODO: Test add trigger with non-existant type
// TODO: Test evaluate with non-existant credential
// TODO: Test evaluate with credential type mismatch
// TODO: Test evaluate with wrong owner

describe("Trigger", async () => {
    let context;

    beforeEach(async () => {
        context = await deployAllContracts();
    })

    it("preprocess get values", async () => {
        let values = await context.trigger.callStatic._preprocess(1, [1, 2]);

        expect(values[0]).to.be.equal(501);
        expect(values[1]).to.be.equal(502);
        expect(values[2]).to.be.equal(503);
        expect(values[3]).to.be.equal(501);
        expect(values[4]).to.be.equal(502);
        expect(values[5]).to.be.equal(503);
    });

    it("preprocess non existant", async () => {
        await expect(context.trigger.callStatic._preprocess(1, [1, 3])).to.be
            .revertedWith("credential type mismatch");
    });

    it("evaluate", async () => {
        // create a trigger 
        await context.trigger.callStatic._preprocess(1, [1, 3]);
    });

    it("not implemented - can't specify same types in credential used", async () => {
        // Same types of credentials might lead to the problem
        // when the UI don't know in which order to put the credentials ids.
        // While the credentials ids are valud, just the wrong order might lead to evaluation failure.
    })
});
