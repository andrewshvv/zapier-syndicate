// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {Expression} from "../ExpressionCodec.sol";
import {Evaluator} from "../Evaluator.sol";

contract TestEvaluateExpression {
    using Evaluator for Expression;
    Expression private _exp;
    uint32[] private _context;

    function init(Expression memory exp_, uint32[] memory context_) public {
        for (uint i = 0; i < exp_.nodes.length; i++) {
            _exp.nodes.push(exp_.nodes[i]);
        }

        _context = context_;
    }

    function evaluate()
    public
    returns (bool)
    {
        // Evaluate expression with the given context.
        return _exp.evaluate(_context);
    }
}
