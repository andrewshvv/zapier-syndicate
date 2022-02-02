const jsep = require("jsep");
const {traverse, getType, resultingType, duplicate} = require("./utils");
const {ProtobufContext} = require("./context");
const {ParserInternalError, ParserUserError} = require("./errors");
const {Duration} = require("@icholy/duration");

const Opcodes = Object.freeze({
    UNSPECIFIED: 0,
    OPCODE_CONST: 1,
    OPCODE_NOT: 2,
    OPCODE_EQ: 3,
    OPCODE_NE: 4,
    OPCODE_LT: 5,
    OPCODE_GT: 6,
    OPCODE_LE: 7,
    OPCODE_GE: 8,
    OPCODE_AND: 9,
    OPCODE_OR: 10,
    OPCODE_GVAL: 11,
    OPCODE_ADD: 12,
    OPCODE_SUB: 13,
    OPCODE_NOW: 14,
    OPCODE_GARRAY: 15,
    OPCODE_CONTAINS: 16,
    OPCODE_IN: 17,
    OPCODE_INVALID: 18
});

/**
 * Expression parser is used to convert the expression string into the list
 * of operands which are understood by the internal solidity interpreter.
 *
 * Note: context is given in prepared form and decoupled from parser intentionally
 * in case the source of context will change from protobuf to something else.
 */
class ExpressionParser {
    constructor() {
        // Define shorcuts for "&&" and "||" operations
        jsep.addBinaryOp("or", 1);
        jsep.addBinaryOp("OR", 1);
        jsep.addBinaryOp("and", 2);
        jsep.addBinaryOp("AND", 2);

        // Define opcode for retrieving 
        // data from credential
        jsep.addUnaryOp("@");

        jsep.addBinaryOp("CONTAINS", 2);
        jsep.addBinaryOp("IN", 2);

        this.logical_opcodes = [
            Opcodes.OPCODE_NOT,
            Opcodes.OPCODE_EQ,
            Opcodes.OPCODE_NE,
            Opcodes.OPCODE_LT,
            Opcodes.OPCODE_GT,
            Opcodes.OPCODE_LE,
            Opcodes.OPCODE_GE,
            Opcodes.OPCODE_AND,
            Opcodes.OPCODE_OR,
            Opcodes.OPCODE_CONTAINS,
            Opcodes.OPCODE_IN
        ]

        this.opcodes = {
            "func_const": Opcodes.OPCODE_CONST,
            "func_get_value": Opcodes.OPCODE_GVAL,
            "func_get_array": Opcodes.OPCODE_GARRAY,
            "CONTAINS": Opcodes.OPCODE_CONTAINS,
            "IN": Opcodes.OPCODE_IN,
            "func_now": Opcodes.OPCODE_NOW,
            "!": Opcodes.OPCODE_NOT,
            "==": Opcodes.OPCODE_EQ,
            "!=": Opcodes.OPCODE_NE,
            "<": Opcodes.OPCODE_LT,
            ">": Opcodes.OPCODE_GT,
            "<=": Opcodes.OPCODE_LE,
            ">=": Opcodes.OPCODE_GE,
            "AND": Opcodes.OPCODE_AND,
            "and": Opcodes.OPCODE_AND,
            "&&": Opcodes.OPCODE_AND,
            "OR": Opcodes.OPCODE_OR,
            "or": Opcodes.OPCODE_OR,
            "||": Opcodes.OPCODE_OR,
            "+": Opcodes.OPCODE_ADD,
            "-": Opcodes.OPCODE_SUB,
        }
    }

    parse(expression, context) {
        const tree = jsep.parse(expression);

        // Traverse left-right, down-top (buttop-up)
        // check the types and convert expression to internal Opcodes
        traverse(tree, null, context, false, true, this._preprocess);

        // Traverse left-right, top-down (up-buttom)
        // define the order of operands
        let idx = 0;
        traverse(tree, null, context, true, true, function (cur_op, ...args) {
            cur_op.index = idx++;
            return true;
        });

        // Traverse left-right, top-down (up-buttom)
        // Create an list of operands which can be understood by the
        //  solidity interpreter library
        let operands = [];
        let checks = {}
        traverse(tree, null, context, true, true, this._build(this.opcodes, operands, checks));

        if (!this.logical_opcodes.includes(operands[0]?.opcode)) {
            throw new ParserUserError("Expression must return boolean");
        }

        if (!checks.credential_used) {
            throw new ParserUserError("Expression must use at least one credential field");
        }

        return operands;
    }


    // _build takes a prepared and preprocessed tree and 
    // converts it to the list of operands
    _build(opcodes, operands, checks) {
        return function (cur_op, ...args) {
            switch (cur_op.type) {
                case jsep.BINARY_EXP:
                    if (!opcodes[cur_op.operator])
                        throw new ParserUserError(`unsupported operator ${operand.type}`);

                    if (cur_op.left.index == null ||
                        cur_op.right.index == null) {
                        throw new ParserInternalError("binary expression: invalid arguments");
                    }

                    operands.push({
                        opcode: opcodes[cur_op.operator],
                        arguments: [],
                        leafs: [cur_op.left.index, cur_op.right.index]
                    });

                    return true;

                case "FuncOperand":
                    switch (cur_op.operator) {
                        case "func_const":
                            operands.push({
                                opcode: opcodes[cur_op.operator],
                                arguments: [cur_op.arguments.value],
                                leafs: []
                            });

                            return true;

                        case "func_get_value":
                        case "func_get_array":
                            if (cur_op.arguments.pointer_on_global_offset == null ||
                                cur_op.arguments.local_offset == null) {
                                throw new ParserInternalError("func_get_array/func_get_value: invalid arguments");
                            }

                            operands.push({
                                opcode: opcodes[cur_op.operator],
                                arguments: [
                                    cur_op.arguments.pointer_on_global_offset,
                                    cur_op.arguments.local_offset
                                ],
                                leafs: []
                            });
                            checks.credential_used = true;
                            return true;

                        case "func_now":
                            if (cur_op.arguments.pointer_on_now == null) {
                                throw new ParserInternalError("func_now: invalid arguments");
                            }

                            operands.push({
                                opcode: opcodes[cur_op.operator],
                                arguments: [
                                    cur_op.arguments.pointer_on_now
                                ],
                                leafs: []
                            });
                            return true;
                    }

                    pretty(cur_op.operator);

                default:
                    throw new ParserInternalError(cur_op.type + " was missed");
            }
        }
    }


    // _preprocess change the initial jsep tree to be suitable for build stage
    // - change the type of operands to FuncOperand
    // - check the types in operands are compatible
    _preprocess(cur_op, next_op, context = {}) {
        let res_type;

        switch (cur_op.type) {
            case jsep.UNARY_EXP:
                if (cur_op.operator == "@" &&
                    cur_op.argument?.type == jsep.IDENTIFIER &&
                    cur_op.argument?.name == "now") {

                    cur_op.type = "FuncOperand";
                    cur_op.operator = "func_now";
                    cur_op.res_type = "int";
                    cur_op.arguments = {pointer_on_now: context.pointer_on_now}
                    delete cur_op.argument;
                    delete cur_op.raw;

                } else if (
                    cur_op.operator == "@" &&
                    cur_op.argument?.type == "FuncOperand"
                ) {
                    duplicate(cur_op.argument, cur_op);
                    delete cur_op.argument;
                    delete cur_op.prefix;
                    delete cur_op.computed;
                }

                return true;

            case jsep.LITERAL:
                // Case: @time(), skip it, it will be handled father
                if (next_op?.type == jsep.CALL_EXP) {
                    return true;
                }

                res_type = getType(cur_op.value);

                cur_op.type = "FuncOperand";
                cur_op.operator = "func_const";
                cur_op.res_type = res_type;

                switch (res_type) {
                    case "int":
                        cur_op.arguments = {value: cur_op.value};
                        break;
                    case "bool":
                        cur_op.arguments = {value: cur_op.value ? 1 : 0};
                        break;
                    case "string":
                        // String literals supported only if on the other side is get value operand
                        const leaf = next_op?.left?.type == "FuncOperand" ? next_op?.left : next_op?.right;
                        if (leaf?.type != "FuncOperand") {
                            throw new ParserUserError(`string litterals are not supported`);
                        }

                        // At this stage another leaf of binary operation is func_get_value
                        // let's check whether the string is one of the possible values of enum
                        const possible_values = leaf?.possible_values ? leaf.possible_values : {};
                        if (!possible_values[cur_op.value]) {
                            throw new ParserUserError(`"${cur_op.value}" is not one of the possible values of enum`);
                        }

                        cur_op.arguments = {value: possible_values[cur_op.value]};
                        cur_op.res_type = "int";
                        break;

                    default:
                        throw new ParserUserError(`unsupported literal type ${res_type}`);
                }

                delete cur_op.raw;
                delete cur_op.value;

                return true;

            case jsep.MEMBER_EXP:
                const name = cur_op.object?.name;
                const property = cur_op.property?.name;

                if (!name || !property) {
                    throw new ParserUserError("name or property of member expression is not defined");
                }

                if (!context[name]) {
                    throw new ParserUserError(`context don't have object "${name}"`);
                }

                if (!context[name][property]) {
                    throw new ParserUserError(`object "${name}" don't have property "${property}"`);
                }

                if (next_op.type != jsep.UNARY_EXP) {
                    throw new ParserUserError(`to get value of credential use "@" operator`);
                }

                const field = context[name][property];
                delete cur_op.object;
                delete cur_op.property;

                cur_op.type = "FuncOperand";
                cur_op.res_type = field.type;
                cur_op.possible_values = field.values;
                cur_op.credential_name = name;
                cur_op.credential_property = property;
                cur_op.arguments = {
                    pointer_on_global_offset: field.pointer_on_global_offset,
                    local_offset: field.local_offset,
                }

                switch (field.type) {
                    case "int":
                    case "bool":
                        cur_op.operator = "func_get_value";
                        return true;
                    case "array[int]":
                        cur_op.operator = "func_get_array";
                        return true;
                    default:
                        throw new ParserUserError(`unsupported member expression type ${field.type}`);
                }

            case jsep.BINARY_EXP:
                res_type = resultingType(
                    cur_op.left.res_type,
                    cur_op.right.res_type,
                    cur_op.operator);

                if (!res_type) {
                    throw new ParserUserError(`incompatible types "${cur_op.left.res_type}" ` +
                        `and "${cur_op.right.res_type}" ` +
                        `for operator "${cur_op.operator}"`);
                }

                cur_op.res_type = res_type;
                return true;

            case jsep.IDENTIFIER:
                return true;

            case jsep.CALL_EXP:
                // TODO: UI might put internal function like func_get_value
                // in the expression, we need to convert it to internal opcode
                // - arg #1: pointer on global offset
                // - arg #2: local offset
                // - arg #3: result type

                switch (cur_op.callee?.name) {
                    // Case: convert @time to func_const
                    case "time":
                        if (cur_op.arguments.length != 1) {
                            throw new ParserUserError(`@time should have one argument - string duration, example: '1 week'`);
                        }

                        if (cur_op.arguments[0]?.type != jsep.LITERAL) {
                            throw new ParserUserError(`@time should have strgin argument, example: '1 week'`);
                        }

                        if (next_op.type != jsep.UNARY_EXP) {
                            throw new ParserUserError(`time function has to be preceeded with "@" operator`);
                        }

                        const duration = cur_op.arguments[0].value;
                        const timestamp = Math.floor((new Duration(duration)).milliseconds() / 1000);
                        cur_op.type = "FuncOperand";
                        cur_op.operator = "func_const";
                        cur_op.res_type = "int";
                        delete cur_op.arguments;
                        delete cur_op.callee;

                        cur_op.arguments = {value: timestamp};
                        return true;

                    default:
                        throw new ParserUserError(`@${cur_op.callee?.name} not supported`);

                }

            default:
                throw new ParserUserError(cur_op.type + " not supported");
        }
    }
}

module.exports = {
    ExpressionParser,
    ProtobufContext,
    Opcodes,
    ParserInternalError,
    ParserUserError
}