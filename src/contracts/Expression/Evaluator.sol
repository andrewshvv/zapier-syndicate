// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ExpressionCodec.sol";
import "./NodeCodec.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library Evaluator {
    using SafeMath for uint256;

    /// An expression is encoded as an array of nodes representing the abstract syntax tree.
    /// +--------+----------------------------------------+------+------------+
    /// | opcode |              description               | i.e. |  args num  |
    /// +--------+----------------------------------------+------+------------+
    /// |   00   | Integer Constant                       |  c   |      0     |
    /// |   01   | Boolean Not Condition                  |  !   |      1     |
    /// |   02   | Equal Comparison                       |  ==  |      2     |
    /// |   03   | Non-Equal Comparison                   |  !=  |      2     |
    /// |   04   | Less-Than Comparison                   |  <   |      2     |
    /// |   05   | Greater-Than Comparison                |  >   |      2     |
    /// |   06   | Non-Greater-Than Comparison            |  <=  |      2     |
    /// |   07   | Non-Less-Than Comparison               |  >=  |      2     |
    /// |   08   | And Condition                          |  &&  |      2     |
    /// |   09   | Or Condition                           |  ||  |      2     |
    /// |   10   | Get value from context                 |  N/A |      2     |
    /// +--------+----------------------------------------+------+------------+

    /// @notice Evaluate whether the expression is true with the given context.
    function evaluate(Expression storage e, uint32[] memory context)
    public
    returns (bool)
    {
        // First node represent the logical opcode, since the
        // end result of expression is always boolean
        return evaluateLogicalOpcode(e, context, 0);
    }

     function evaluateValueOpcode(
         Expression storage e,
         uint32[] memory context,
         uint32 idx
     ) private view returns (int32) {
         Node memory node = e.nodes[idx];
         Opcode opcode = node.opcode;

         if (opcode == Opcode.OPCODE_CONST) {
             return node.arguments[0];
         } else if (opcode == Opcode.OPCODE_GVAL) {
             uint32 offset = uint32(node.arguments[0]);
             uint32 fieldID = uint32(node.arguments[1]);
             return int32(context[offset + fieldID]);
         }

         revert("invalid opcode");
     }

     // evaluateLogicalOpcode...
     // @context are given in the properly sorted matter, i.e. in the order it will
     // be used in polish notation array.
     function evaluateLogicalOpcode(
         Expression storage e,
         uint32[] memory context,
         uint32 idx
     ) public view returns (bool) {
         Node memory node = e.nodes[idx];
         Opcode opcode = node.opcode;

         if (opcode == Opcode.OPCODE_NOT) {
             return !evaluateLogicalOpcode(e, context, node.leafs[0]);
         } else if (
             opcode == Opcode.OPCODE_EQ ||
             opcode == Opcode.OPCODE_GE ||
             opcode == Opcode.OPCODE_NE ||
             opcode == Opcode.OPCODE_LT ||
             opcode == Opcode.OPCODE_GT
         ) {
             require(node.leafs.length == 2, "invalid number of leafs");
             int32 arg0 = evaluateValueOpcode(e, context, node.leafs[0]);
             int32 arg1 = evaluateValueOpcode(e, context, node.leafs[1]);

             if (opcode == Opcode.OPCODE_EQ) {
                 return arg0 == arg1;
             } else if (opcode == Opcode.OPCODE_NE) {
                 return arg0 != arg1;
             } else if (opcode == Opcode.OPCODE_LT) {
                 return arg0 < arg1;
             } else if (opcode == Opcode.OPCODE_GT) {
                 return arg0 > arg1;
             } else if (opcode == Opcode.OPCODE_LE) {
                 return arg0 <= arg1;
             } else if (opcode == Opcode.OPCODE_GE) {
                 return arg0 >= arg1;
             }
         } else if (opcode == Opcode.OPCODE_AND || opcode == Opcode.OPCODE_OR) {
             bool arg0 = evaluateLogicalOpcode(e, context, node.leafs[0]);

             // Optimisation: short-circuit evaluation
             if (opcode == Opcode.OPCODE_AND) {
                 if (!arg0) return false;

                 return evaluateLogicalOpcode(e, context, node.leafs[1]);
             } else if (opcode == Opcode.OPCODE_OR) {
                 if (arg0) return true;

                 return evaluateLogicalOpcode(e, context, node.leafs[1]);
             }
         }

         revert("invalid opcode");
     }
}
