const protobuf = require("protobufjs");
const {enumerate, camel_to_snake_case} = require("./utils");

const protobufTypes = {
    "double": null,
    "float": null,
    "int32": null,
    "int64": null,
    "uint32": "int",
    "uint64": null,
    "sint32": null,
    "sint64": null,
    "fixed32": null,
    "fixed64": null,
    "sfixed32": null,
    "sfixed64": null,
    "bool": "bool",
    "string": null,
    "bytes": null,
};

/**
 * Extracts the information from protobuf file - context, which is required
 * for proper contruction of list  of operands by the expression parser, in particular:
 *
 * 1. Mapping of enum values which is required for conversion string to enum number
 * in case of the 'enum' to string comparison.
 *
 * 2. Local offset information about the position of particular field
 * value in value array relative to the start position of credential values.
 *
 * 3. Pointer on global offset which is the index on where the
 * global offset is stored inside the value array. Global offset
 * is required in order understand where values of particulat credential starting.
 *
 * 4. Types of fields which are required for type checking in expression parser.
 *
 * Q: What happens if the number of credential fields will change?
 * A: Offset can be given in values
 *   - Node get_value opcode of credential #2:
 *     - argument #1: pointer in context to the offset (1)
 *     - argument #2: pointer in context to the field number (n)
 *   - Value array passed into sol lib interpreter:
 *     - 0: offset index of credential #1 values (j)
 *     - 1: offset index of credential #2 values (k)
 *     -    ...
 *     -  : current_timestamp
 *     - j: value #1 of credential #1
 *     -    ...
 *     -  : value #n of credential #1
 *     -    ...
 *     - k: value #1 of credential #2
 *     -    ...
 *     -  : value #n of credential #2
 */
class ProtobufContext {

    async initialise(files) {
        let credential_roots = [];
        for (const path of files) {
            let err, root = await protobuf.load(path);
            if (err) throw err;
            credential_roots.push(root);
        }

        this.credential_roots = credential_roots
    }

    /**
     * Creates a context suitable to be digest by the expression parser,
     * it filters out unnessessary information from protobuf message
     */
    create() {
        if (this.credential_roots == null) {
            throw new Error("protobuf converter is not initialised");
        }

        let context = {};
        for (let [idx, credential] of enumerate(this.credential_roots)) {
            let [name, obj] = this.createCredentialContext(idx, credential);
            context[name] = obj;
        }

        // where the now time will be in values array
        context.pointer_on_now = this.credential_roots.length + 1;
        return context;
    }

    createCredentialContext(pointer_on_global_offset, credential) {
        for (let [name, obj] of Object.entries(credential.nested)) {
            // Grab only protobuf Messages, not the type declarations
            if (obj.constructor.name == "Type") {
                let obj_ = {};

                for (let [, field] of Object.entries(obj.fields)) {
                    let field_ = {};

                    // Take only what we need
                    field_.rule = field.rule;
                    field_.type = field.type;
                    field_.name = camel_to_snake_case(field.name);

                    // index in the value array where to take the global offset
                    field_.pointer_on_global_offset = pointer_on_global_offset;

                    // local offset which tells how much to add to the global offset
                    // to get the value of the field in the value array
                    field_.local_offset = field.id - 1;

                    field_.options = field.options;

                    // Take possible values in a case of enum
                    let parent = field.parent.parent.nested[field.type];
                    field_.values = parent?.values;
                    field_.values_by_id = parent?.valuesById;
                    field_.type = this._convertProtobufType(field.type, field.repeated, parent);

                    obj_[field_.name] = field_;
                }

                // In expression editor we refer names in lowercase
                return [name.toLowerCase(), obj_];
            }
        }

        throw new Error("Protobuf doesn't contain Message");
    }

    _convertProtobufType(type, repeated, parent) {
        if (parent?.constructor?.name == "Enum") {
            type = "uint32";
        }

        if (!protobufTypes[type]) {
            throw new Error(`${type} protobuf type is not supported`);
        }

        if (repeated) {
            return "array[" + protobufTypes[type] + "]";
        }

        return protobufTypes[type]
    }
}

module.exports = {ProtobufContext}