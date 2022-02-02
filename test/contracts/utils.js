const {ethers} = require("hardhat");
const protobuf = require("protobufjs");
const util = require("util");

function getHex(hex) {
    return ethers.utils.arrayify(hex);
    ;
}

function tokens(val) {
    return ethers.utils.parseEther(val);
}

function format(n) {
    return ethers.utils.formatEther(n);
}

// getFundIndexById is helper function to return array index of fund by its id
async function helperGetFundIndexById(fundContract, fundId) {
    let allFundDetails = await fundContract.getAllFundDetails()
    for (let index = 0; index < allFundDetails.length; index++) {
        if (allFundDetails[index].fundId.toNumber() == fundId.toNumber()) {
            return index;
        }
    }

    throw new Error("fund not found");
}

// getFundByDetailsId is helper function to return fund details by its id.
async function helperGetFundDetailsById(fundContract, fundId) {
    let fundIndex = await helperGetFundIndexById(fundContract, fundId)
    let allFundDetails = await fundContract.getAllFundDetails()
    return allFundDetails[fundIndex];
}


// mintAnItem version of function which returns the solidity return value from event.
async function helperMintAnItem(credentialContract, ...args) {
    const tx = await credentialContract.mintAnItem(...args);
    const receipt = await tx.wait();
    const event = receipt.events.find(event => event.event === 'Transfer');
    return event.args['tokenId']
}

// createFund version of create fund function which return 
// the fund id, by listening to the event.
async function helperCreateFund(fundContract, ...args) {
    const tx = await fundContract.createFund(...args);
    const receipt = await tx.wait();
    const event = receipt.events.find(event => event.event === 'FundCreated');
    return event.args['fundId']

}

async function deployAllContracts() {
    let owner;
    [owner, ...addrs] = await ethers.getSigners();

    // Deploy credentials smart contract
    let factory = await ethers.getContractFactory("Credentials");
    credentials = await factory.connect(owner).deploy("credential", "CRT");
    await credentials.deployed();

    // Ensure that the event polling is happens faster
    credentials.provider.pollingInterval = 100;

    // Encode credential metadata
    const Message = new protobuf.Type("Message")
        .add(new protobuf.Field("length", 1, "uint32"))
        .add(new protobuf.Field("winner", 2, "uint32"))
        .add(new protobuf.Field("place", 3, "uint32"))
        .add(new protobuf.Field("category", 4, "uint32"))

    // Encode with protobuf 
    const message = Message.create({length: 3, winner: 501, place: 502, category: 503});
    const metadata = Message.encode(message).finish();

    // Add identical credentials with metadata
    await credentials.connect(owner).mintCredential(owner.address, "", 1, metadata)
    await credentials.connect(owner).mintCredential(owner.address, "", 1, metadata)

    // Deploy library codec for credential metadata
    factory = await ethers.getContractFactory("CredentialCodec");
    const credentiaCodec = await factory.deploy();
    await credentiaCodec.deployed();

    // Deploy codec library for expression node
    factory = await ethers.getContractFactory("NodeCodec");
    const nodeCodec = await factory.deploy();
    await nodeCodec.deployed();

    // Deploy codec library for expression 
    factory = await ethers.getContractFactory("ExpressionCodec");
    const expressionCodec = await factory.deploy();
    await expressionCodec.deployed();

    // Deploy expression evaluation library
    factory = await ethers.getContractFactory("Evaluator");
    const evaluator = await factory.deploy();
    await evaluator.deployed();

    // Deploy trigger contract
    factory = await ethers.getContractFactory("Trigger", {
        libraries: {
            // ExpressionCodec: expressionCodec.address,
            CredentialCodec: credentiaCodec.address,
            Evaluator: evaluator.address
        }
    });
    trigger = await factory.deploy(credentials.address);
    await trigger.deployed();

    // Ensure that the event polling is happens faster
    trigger.provider.pollingInterval = 100;

    // Add trigger with two credentials used
    await trigger.addTrigger("0x", [1, 1]);

    return {
        contracts: {
            credentials: credentials,
            trigger: trigger,
        },
        libraries: {
            nodeCodec: nodeCodec,
            expressionCodec: expressionCodec,
            credentiaCodec: credentiaCodec,
            evaluator: evaluator,
        },
        accounts: {
            owner: owner,
        }
    }
}

function pretty(...args) {
    console.log(util.inspect(args, {showHidden: false, depth: null, colors: true}));
}

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

const range = (i, k) => Array(k - i).fill().map((_, idx) => i + idx);

module.exports = {
    getHex,
    pretty,
    range,
    zip,
    deployAllContracts,
    tokens,
    format,
    helperGetFundIndexById,
    helperGetFundDetailsById,
    helperCreateFund,
    helperMintAnItem,
};