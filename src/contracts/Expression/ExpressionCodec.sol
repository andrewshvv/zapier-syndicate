// File automatically generated by protoc-gen-sol v0.2.0
// SPDX-License-Identifier: CC0
pragma solidity ^0.8.0;

import {Node, NodeCodec} from "./NodeCodec.sol";
import {ProtobufLib} from "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";

    struct Expression {
        Node[] nodes;
    }

library ExpressionCodec {
    function decode(
        Expression storage instance,
        uint64 initial_pos,
        bytes memory buf,
        uint64 len
    ) internal returns (bool) {
        // Previous field number
        uint64 previous_field_number = 0;
        // Current position in the buffer
        uint64 pos = initial_pos;

        // Sanity checks
        if (pos + len < pos) {
            return false;
        }

        while (pos - initial_pos < len) {
            // Decode the key (field number and wire type)
            bool success;
            uint64 field_number;
            ProtobufLib.WireType wire_type;
            (success, pos, field_number, wire_type) = ProtobufLib.decode_key(
                pos,
                buf
            );
            if (!success) {
                return false;
            }

            // Check that the field number is within bounds
            if (field_number > 1) {
                return false;
            }

            // Check that the field number of monotonically increasing
            if (field_number <= previous_field_number) {
                return false;
            }

            // Check that the wire type is correct
            success = check_key(field_number, wire_type);
            if (!success) {
                return false;
            }

            // Actually decode the field
            (success, pos) = decode_field(
                pos,
                buf,
                len,
                field_number,
                instance
            );
            if (!success) {
                return false;
            }

            previous_field_number = field_number;
        }

        // Decoding must have consumed len bytes
        if (pos != initial_pos + len) {
            return false;
        }

        return true;
    }

    function check_key(uint64 field_number, ProtobufLib.WireType wire_type)
    internal
    pure
    returns (bool)
    {
        if (field_number == 1) {
            return wire_type == ProtobufLib.WireType.LengthDelimited;
        }

        return false;
    }

    function decode_field(
        uint64 initial_pos,
        bytes memory buf,
        uint64 len,
        uint64 field_number,
        Expression storage instance
    ) internal returns (bool, uint64) {
        uint64 pos = initial_pos;

        if (field_number == 1) {
            bool success;
            (success, pos) = decode_1(pos, buf, instance);
            if (!success) {
                return (false, pos);
            }

            return (true, pos);
        }

        return (false, pos);
    }

    // Expression.nodes
    function decode_1(
        uint64 pos,
        bytes memory buf,
        Expression storage instance
    ) internal returns (bool, uint64) {
        bool success;

        uint64 initial_pos = pos;

        // Do one pass to count the number of elements
        uint64 cnt = 0;
        while (pos < buf.length) {
            uint64 len;
            (success, pos, len) = ProtobufLib.decode_embedded_message(pos, buf);
            require(success, "failed to decode embedded message");

            // Sanity checks
            require(pos + len > pos, "failed to pass sanity check");

            pos += len;
            cnt += 1;

            if (pos >= buf.length) {
                break;
            }

            // Decode next key
            uint64 field_number;
            (success, pos, field_number,) = ProtobufLib.decode_key(pos, buf);
            require(success, "failed to decode key");

            // Check if the field number is different
            if (field_number != 1) {
                break;
            }
        }

        // Now actually parse the elements
        pos = initial_pos;
        for (uint64 i = 0; i < cnt; i++) {
            uint64 len;
            (success, pos, len) = ProtobufLib.decode_embedded_message(pos, buf);
            require(success, "failed to decode embedded message");

            initial_pos = pos;

            Node memory node;
            (success, pos, node) = NodeCodec.decode(pos, buf, len);
            require(success, "failed to decode node");

            instance.nodes.push(node);

            // Skip over next key, reuse len
            if (i < cnt - 1) {
                (success, pos, len) = ProtobufLib.decode_uint64(pos, buf);
                require(success, "failed to decode key");
            }
        }

        return (true, pos);
    }
}