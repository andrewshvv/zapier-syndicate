const {ExpressionParser, ProtobufContext} = require("../../src/parser");
const {tests_parsing} = require("./vectors");
const {expect} = require("chai");
const path = require("path");

describe("Parser", async () => {
    it.only("parse expressions", async () => {
        const protoFile = path.join(__dirname, "../../src/protobuf/credential.proto");

        let pc = new ProtobufContext();
        await pc.initialise([protoFile]);
        const context = pc.create();
        const parser = new ExpressionParser();


        for (let test of tests_parsing) {
            if (test.operands != null) {
                let operands = parser.parse(test.expression, context);
                expect(operands).to.deep.equal(test.operands, test.name);
            } else {
                // https://stackoverflow.com/questions/42976291/expect-not-tothrow-function-with-arguments-jasmine
                expect(function() {
                    parser.parse(test.expression, context)
                }).to.throw(test.error_cls);
            }

            console.log(" (passed) " + test.name);
        }
    });
});