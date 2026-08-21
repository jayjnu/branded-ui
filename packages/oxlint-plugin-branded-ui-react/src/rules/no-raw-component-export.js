export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require exported components to use a Branded UI factory",
    },
  },
  create(context) {
    function report(name) {
      context.report({
        node: name,
        message: `Exported component "${name.name}" must use a Branded UI factory.`,
      });
    }

    function checkDeclaration(declaration) {
      if (!declaration) return;
      if (
        declaration.type === "FunctionDeclaration" &&
        declaration.id &&
        isPascalCase(declaration.id.name)
      ) {
        report(declaration.id);
        return;
      }
      if (declaration.type !== "VariableDeclaration") return;
      for (const item of declaration.declarations) {
        if (
          item.id.type === "Identifier" &&
          isPascalCase(item.id.name) &&
          isRawComponent(item.init)
        ) {
          report(item.id);
        }
      }
    }

    return {
      ExportNamedDeclaration: (node) => checkDeclaration(node.declaration),
      ExportDefaultDeclaration: (node) => checkDeclaration(node.declaration),
    };
  },
};

function isRawComponent(node) {
  if (
    node?.type === "ArrowFunctionExpression" ||
    node?.type === "FunctionExpression"
  ) {
    return true;
  }
  return (
    node?.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    (node.callee.name === "memo" || node.callee.name === "forwardRef")
  );
}

function isPascalCase(value) {
  return /^[A-Z]/.test(value);
}
