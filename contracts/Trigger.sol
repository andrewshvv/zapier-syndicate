// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";
import "./Codec.sol";

contract Trigger {
    constructor() {}

    function decodeMetadata(bytes memory metadata)
        external
        returns (uint32[] memory values)
    {
        bool success;
        uint64 pos;

        (success, pos, values) = CredentialCodec.decode(
            0,
            metadata,
            uint64(metadata.length)
        );
        if (!success) {
            revert("failed to decode metadata");
        }

        return values;
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
