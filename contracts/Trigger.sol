// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";

contract Trigger {
    constructor() {}

    function decode() public {
        bytes memory s;
        bool _val;
        uint64 _a;
        uint64 _b;
        ProtobufLib.WireType _wireType;

        (_val, _a, _b, _wireType) = ProtobufLib.decode_key(1, s);
    }
}
