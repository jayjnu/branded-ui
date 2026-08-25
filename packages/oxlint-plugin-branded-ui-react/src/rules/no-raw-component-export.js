export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require exported components to use a Branded UI factory",
    },
  },
  create(context) {
    const localDeclarations = new Map();
    const reported = new WeakSet();

    function report(name) {
      if (reported.has(name)) return;
      reported.add(name);
      context.report({
        node: name,
        message: `Exported component "${name.name}" must use a Branded UI factory.`,
      });
    }

    function checkVariable(item) {
      if (
        item.id.type === "Identifier" &&
        isPascalCase(item.id.name) &&
        isRawComponent(item.init)
      ) {
        report(item.id);
      }
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
      for (const item of declaration.declarations) checkVariable(item);
    }

    function collectLocalDeclarations(program) {
      for (const statement of program.body) {
        const declaration =
          statement.type === "ExportNamedDeclaration"
            ? statement.declaration
            : statement;
        if (declaration?.type === "FunctionDeclaration" && declaration.id) {
          localDeclarations.set(declaration.id.name, declaration);
        }
        if (declaration?.type !== "VariableDeclaration") continue;
        for (const item of declaration.declarations) {
          if (item.id.type === "Identifier") {
            localDeclarations.set(item.id.name, item);
          }
        }
      }
    }

    function checkLocalSpecifiers(node) {
      if (node.source || node.exportKind === "type") return;
      for (const specifier of node.specifiers) {
        if (
          specifier.type !== "ExportSpecifier" ||
          specifier.exportKind === "type" ||
          specifier.local.type !== "Identifier"
        ) {
          continue;
        }
        const declaration = localDeclarations.get(specifier.local.name);
        if (declaration?.type === "VariableDeclarator") {
          checkVariable(declaration);
        } else {
          checkDeclaration(declaration);
        }
      }
    }

    return {
      Program: collectLocalDeclarations,
      ExportNamedDeclaration: (node) => {
        checkDeclaration(node.declaration);
        checkLocalSpecifiers(node);
      },
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
