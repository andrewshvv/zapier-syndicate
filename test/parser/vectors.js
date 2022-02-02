const {Opcodes, ParserInternalError, ParserUserError} = require("../../src/parser");
const {Opcode} = require("hardhat/internal/hardhat-network/stack-traces/opcodes");

let tests_parsing = [
    {
        expression: "@now >= @somecredential.uint32_field",
        name: "check @now operand working",
        operands: [
            {opcode: Opcodes.OPCODE_GE, arguments: [], leafs: [1, 2]},
            {opcode: Opcodes.OPCODE_NOW, arguments: [2], leafs: []},
            {opcode: Opcodes.OPCODE_GVAL, arguments: [0, 0], leafs: []}
        ],
    },
    {
        expression: "@time('12w') >= @somecredential.uint32_field",
        name: "check @time operand working",
        operands: [
            {opcode: Opcodes.OPCODE_GE, arguments: [], leafs: [1, 2]},
            {opcode: Opcodes.OPCODE_CONST, arguments: [7257600], leafs: []},
            {opcode: Opcodes.OPCODE_GVAL, arguments: [0, 0], leafs: []}
        ],
    },
    {
        expression: "@somecredential.uint32_array_field CONTAINS 1",
        name: "check CONTAINS operand working",
        operands: [
            {opcode: Opcodes.OPCODE_CONTAINS, arguments: [], leafs: [1, 2]},
            {opcode: Opcodes.OPCODE_GARRAY, arguments: [0, 3], leafs: []},
            {opcode: Opcodes.OPCODE_CONST, arguments: [1], leafs: []}
        ],
    },
    // { TODO: Fix in, it is not working properly
    //     expression: "'option_one' IN @somecredential.enum_field",
    //     name: "check IN func with enum and string working",
    //     operands: [],
    // },
    {
        expression: "1 + 1",
        name: "check result is not a logical expression",
        error_cls: ParserUserError,
    },
    {
        expression: "@somecredential.enum_field == 'option_one'",
        name: "check mapping of string to enum int with '=='",
        operands: [
            {opcode: Opcodes.OPCODE_EQ, arguments: [], leafs: [1, 2]},
            {opcode: Opcodes.OPCODE_GVAL, arguments: [0, 1], leafs: []},
            {opcode: Opcodes.OPCODE_CONST, arguments: [1], leafs: []}
        ],
    },

    {
        expression: "@somecredential.enum_array_field == 'option_one' ",
        name: "check can't compare array and enum",
        error_cls: ParserUserError,
    },
    {
        expression: "1 == 1",
        name: "check when credential aren't used",
        error_cls: ParserUserError,
    },
    {
        expression: "@somecredential.enum_array_field CONTAINS '1234567' ",
        name: "check can't find value in enum",
        error_cls: ParserUserError,
    },
    {
        expression: "@somecredential.enum_array_field IN 'option_one' ",
        name: "check incompatible types for 'in' func and array and int types",
        error_cls: ParserUserError,
    },
    {
        expression: "'option_one' IN @somecredential.enum_array_field",
        name: "check incompatible types for 'in' func, intarray and int types",
        error_cls: ParserUserError,
    },
    {
        expression: "(@now >= (@time('12w') + @somecredential.uint32_field)) AND (@somecredential.bool_field == true) AND (@somecredential.enum_array_field CONTAINS 'option_one')",
        name: "check complex expression working",
        operands: [
            {opcode: 9, arguments: [], leafs: [1, 10]},
            {opcode: 9, arguments: [], leafs: [2, 7]},
            {opcode: 8, arguments: [], leafs: [3, 4]},
            {opcode: 14, arguments: [2], leafs: []},
            {opcode: 12, arguments: [], leafs: [5, 6]},
            {opcode: 1, arguments: [7257600], leafs: []},
            {opcode: 11, arguments: [0, 0], leafs: []},
            {opcode: 3, arguments: [], leafs: [8, 9]},
            {opcode: 11, arguments: [0, 4], leafs: []},
            {opcode: 1, arguments: [1], leafs: []},
            {opcode: 16, arguments: [], leafs: [11, 12]},
            {opcode: 15, arguments: [0, 2], leafs: []},
            {opcode: 1, arguments: [1], leafs: []},
        ]
    }
]

module.exports = {
    tests_parsing
}