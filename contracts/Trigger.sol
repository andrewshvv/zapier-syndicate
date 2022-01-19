// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";

contract Trigger {
    constructor() {}

    function evaluate(bytes memory metadata) view public {
        bool success;
        uint64 pos;
        uint64 fieldNumber;
        ProtobufLib.WireType wireType;
        
        uint64 _pos = 1;
        (success, pos, fieldNumber, wireType) = ProtobufLib.decode_key(_pos, metadata);

        console.log("success: ", success);
        console.log("pos: ", pos);
        console.log("_pos: ", _pos);
        console.log("fieldNumber: ", fieldNumber);
        console.log("wireType: ", uint256(wireType));
    }
}
