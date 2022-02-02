// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./CredentialCodec.sol";
import "./Credentials.sol";
import "./Expression/ExpressionCodec.sol";
import "./Expression/Evaluator.sol";

contract Trigger {
    // TODO: What will happen on revove of the trigger?
    using Counters for Counters.Counter;
    /// @dev Expression evaluation
    using Evaluator for Expression;
    /// @dev Protocol Buffers decode functions
    using ExpressionCodec for Expression;

    /// @notice used to assign the unique id to the triggers.
    Counters.Counter private triggerIdIterator;

    /// @notice mapping of trigger id to the expression used for trigger evaluation.
    mapping(uint256 => Expression) private expressions;

    /** @notice mapping of a trigger id to the sorted array 
    of credential types used inside the trigger expression. */
    mapping(uint256 => uint256[]) private credentialsUsed;

    /// @notice credentials contract.
    Credentials credentials;

    constructor(Credentials credentials_) {
        credentials = credentials_;
    }

    /// @notice evaluates trigger expression
    /// @param triggerId_ is the id of the trigger
    /// @param credentialIds_ is the array of credential ids given for expression evaluation.
    /// @return whether the given context satisfies the trigger expression.
    function evaluate(uint256 triggerId_, uint256[] memory credentialIds_)
    public
    returns (bool)
    {
        // Build the context from given credentials.
        uint32[] memory context = _preprocess(triggerId_, credentialIds_);

        // Evaluate expression with the given context.
        return expressions[triggerId_].evaluate(context);
    }

    /// @notice registers a trigger with the given expression.
    /// @param blob protobuf encoded expression.
    function addTrigger(bytes memory blob, uint256[] memory credentialsUsed_)
    public
    returns (uint256)
    {
        triggerIdIterator.increment();
        uint256 triggerId = triggerIdIterator.current();

        // Decode abstract syntax tree from protobuf blob,
        // we use protobuf encoding in order to reduce the
        // cost of the calldata.
        Expression storage exp = expressions[triggerId];
        bool success = exp.decode(0, blob, uint32(blob.length));
        require(success, "failed to decode expression");

        credentialsUsed[triggerId] = credentialsUsed_;

        return triggerId;
    }

    /// @notice does the preprocessing checks for the trigger expression.
    /// @return credential metadata array which will given as context for equation evaluation
    function _preprocess(uint256 triggerId, uint256[] memory credentialIds)
    public
    view
    returns (uint32[] memory)
    {
        uint256[] memory credentialTypes = credentialsUsed[triggerId];

        require(
            credentialTypes.length == credentialIds.length,
            "wrong number of credentials"
        );

        uint32[] memory allValues;
        for (uint256 i = 0; i < credentialIds.length; i++) {
            uint256 cid = credentialIds[i];
            uint256 ctyp = credentialTypes[i];

            if (credentials.typeOf(cid) != ctyp) {
                revert("credential type mismatch");
            }

            if (credentials.ownerOf(cid) != msg.sender) {
                revert("credential owner mismatch");
            }

            // Get the protobuf encoded values of the credential
            bytes memory metadata = credentials.metadataOf(cid);
            require(metadata.length > 0, "credential metadata is empty");

            // Decode protobuf decoded metadata
            uint32[] memory values;
            bool success;
            (success, , values) = CredentialCodec.decode(
                0,
                metadata,
                uint64(metadata.length)
            );
            require(success, "failed to decode metadata");

            allValues = _concat(allValues, values);
        }

        return allValues;
    }

    // @dev concatenate two arrays.
    function _concat(uint32[] memory arr1, uint32[] memory arr2)
    internal
    pure
    returns (uint32[] memory)
    {
        uint32[] memory returnArr = new uint32[](arr1.length + arr2.length);

        uint32 i = 0;
        for (; i < arr1.length; i++) {
            returnArr[i] = arr1[i];
        }

        uint32 j = 0;
        while (j < arr2.length) {
            returnArr[i++] = arr2[j++];
        }

        return returnArr;
    }
}
