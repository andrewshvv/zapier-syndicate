const jsep = require("jsep");

/// @notice traverses the expression tree and calls the callback function on each node
/// @param cur_op the expression to traverse
/// @param op on top=true is the previous node, on top=false (down), op is the next node
/// @param top call callback starting from top tree node, or from bottom
/// @param left call callback on left leafs first, or on right leafs first
/// @param callback function to call on each node
function traverse(cur_op, op, context, top, left, callback) {

    if (!callback) throw new Error("callback is required");
    if (!cur_op) throw new Error("cur_op is required");

    switch (cur_op.type) {
        case jsep.BINARY_EXP:
            if (top) {
                if (!callback(cur_op, op, context)) return
            }

            if (left) {
                traverse(cur_op.left, cur_op, context, top, left, callback);
                traverse(cur_op.right, cur_op, context, top, left, callback);
            } else {
                traverse(cur_op.right, cur_op, context, top, left, callback);
                traverse(cur_op.left, cur_op, context, top, left, callback);
            }

            if (!top) {
                if (!callback(cur_op, op, context)) return
            }

            return;

        case jsep.LITERAL:
        case jsep.IDENTIFIER:
        case "FuncOperand":
            if (!callback(cur_op, op, context)) return
            return;

        case jsep.UNARY_EXP:
            if (top) {
                if (!callback(cur_op, op, context)) return
            }

            traverse(cur_op.argument, cur_op, context, top, left, callback);

            if (!top) {
                if (!callback(cur_op, op, context)) return
            }
            return;

        case jsep.MEMBER_EXP:
            if (top) {
                if (!callback(cur_op, op, context)) return
            }
            traverse(cur_op.object, cur_op, context, top, left, callback);
            traverse(cur_op.property, cur_op, context, top, left, callback);

            if (!top) {
                if (!callback(cur_op, op, context)) return
            }
            return;

        case "NewExpression":
        case jsep.CALL_EXP:
            if (top) {
                if (!callback(cur_op, op, context)) return
            }

            for (argument of cur_op.arguments)
                traverse(argument, cur_op, context, top, left, callback);

            traverse(cur_op.callee, cur_op, context, top, left, callback);

            if (!top) {
                if (!callback(cur_op, op, context)) return
            }
            return;

        case jsep.COMPOUND:
            throw new Error(`seems like your expression contains two separate expressions`);

        default:
            throw new Error(`${cur_op.type} is not supported`);
    }
}

function getType(value) {
    switch (typeof value) {
        case "string":
            return "string";
        case "number":
            const isInt = value % 1 === 0;
            return isInt ? "int" : "float";
        case "boolean":
            return "bool";
    }
}

function resultingType(t1, t2, op) {
    switch (op) {
        case "==":
            if (t1 == "int" && t2 == "int") return "int";
            if (t1 == "bool" && t2 == "bool") return "bool";
            break;
        case "!=":
            if (t1 == "bool" && t2 == "bool") return "bool";
            break;
        case "!":
            if (t1 == "bool") return "bool";
            break;
        case ">=":
            if (t1 == "int" && t2 == "int") return "bool";
            break;
        case "<=":
            if (t1 == "int" && t2 == "int") return "bool";
            break;
        case ">":
            if (t1 == "int" && t2 == "int") return "bool";
            break;
        case "<":
            if (t1 == "int" && t2 == "int") return "bool";
            break;
        case "&&":
        case "and":
        case "AND":
            if (t1 == "bool" && t2 == "bool") return "bool";
            break;
        case "||":
        case "or":
        case "OR":
            if (t1 == "bool" && t2 == "bool") return "bool";
            break;
        case "in":
        case "IN":
            if (t1 == "int" && t2 == "array[int]") return "bool";
            break;
        case "contains":
        case "CONTAINS":
            if (t1 == "array[int]" && t2 == "int") return "bool";
            break
        case "+":
            if (t1 == "int" && t2 == "int") return "int";
            break
        case "-":
            if (t1 == "int" && t2 == "int") return "int";
            break
    }
}

const duplicate = (a, b) => {
    for (const k in a) b[k] = a[k]
};

function* enumerate(iterable) {
    let i = 0;

    for (const x of iterable) {
        yield [i, x];
        i++;
    }
}

const camel_to_snake_case = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

module.exports = {
    traverse,
    duplicate,
    camel_to_snake_case,
    enumerate,
    getType,
    resultingType
}