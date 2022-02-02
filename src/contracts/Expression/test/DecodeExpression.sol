// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Expression.sol";

contract DecodeExpression {
    using ExpressionCodec for Expression;
    Expression private exp;
    Node private node;

    function decodeExpression(bytes memory blob)
    public
    returns (Expression memory)
    {
        require(blob.length > 0, "blob is empty");
        bool success = exp.decode(0, blob, uint32(blob.length));
        require(success, "failed to decode expression");
        return exp;
    }

    function decodeNode(bytes memory blob) public returns (Node memory) {
        require(blob.length > 0, "blob is empty");

        bool success;
        (success, , node) = NodeCodec.decode(0, blob, uint32(blob.length));
        require(success, "failed to decode node");
        return node;
    }
}
