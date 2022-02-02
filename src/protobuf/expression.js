function operands_to_protobuf(operands) {
    let err, node_root = await protobuf.load(path.join(__dirname, "node.proto"));
    if (err) throw err;

    throw new Error("Not implemented");
}