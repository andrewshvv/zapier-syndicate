// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";
import "./Codec.sol";

contract Trigger {
    constructor() {}

    function evaluate(bytes memory metadata) external {
        bool success;
        uint64 pos;
        uint32[] memory values;
        
        (success, pos, values) = CredentialCodec.decode(0, metadata, uint64(metadata.length));

        for (uint64 i = 0; i < values.length; i++) {
            console.log("value: ", i, values[i]);
        }
    }
}

contract CredentialsArray {
    mapping(uint32 => uint32[]) public credentials;
    

    function add(uint32[] memory metadata) external {
        credentials[0] = metadata;
    }
}

contract CredentialsBytes {
    mapping(uint32 => bytes) public credentials;

    function add(bytes memory metadata) external {
        credentials[0] = metadata;
    }
}
