const PACKAGE = "@jayjnu/branded-ui-react";
const UI_FACTORIES = new Set(["pureUI", "layoutUI", "syncUI", "asyncUI"]);

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent UI declaration modules from importing Binding modules",
    },
  },
  create(context) {
    const factories = new Set();
    const bindingImports = [];
    let declaresUI = false;

    return {
      ImportDeclaration(node) {
        if (node.source.value === PACKAGE) {
          collectFactoryImports(node, factories);
        } else if (/\.binding(?:\.[^/]*)?$/.test(node.source.value)) {
          bindingImports.push(node.source);
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          factories.has(node.callee.name)
        ) {
          declaresUI = true;
        }
      },
      "Program:exit"() {
        if (!declaresUI) return;
        for (const source of bindingImports) {
          context.report({
            node: source,
            message: "UI declaration modules cannot depend on .binding modules.",
          });
        }
      },
    };
  },
};

function collectFactoryImports(node, output) {
  for (const specifier of node.specifiers) {
    if (specifier.type !== "ImportSpecifier") continue;
    const imported = specifier.imported.name ?? specifier.imported.value;
    if (UI_FACTORIES.has(imported)) output.add(specifier.local.name);
  }
}
