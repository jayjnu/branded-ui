const PACKAGE = "@jayjnu/branded-ui-react";
const UI_FACTORIES = new Set(["pureUI", "layoutUI", "syncUI", "asyncUI"]);
const DEFAULT_BINDING_FILE_SUFFIXES = [".binding"];

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent UI declaration modules from importing Binding modules",
    },
    schema: [
      {
        type: "object",
        properties: {
          bindingFileSuffixes: {
            type: "array",
            items: { type: "string", minLength: 1 },
            minItems: 1,
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [
      { bindingFileSuffixes: DEFAULT_BINDING_FILE_SUFFIXES },
    ],
  },
  create(context) {
    const option = context.options[0];
    const bindingFileSuffixes =
      option &&
      typeof option === "object" &&
      !Array.isArray(option) &&
      Array.isArray(option.bindingFileSuffixes)
        ? option.bindingFileSuffixes
        : DEFAULT_BINDING_FILE_SUFFIXES;
    const factories = new Set();
    const bindingImports = [];
    let declaresUI = false;

    return {
      ImportDeclaration(node) {
        if (node.source.value === PACKAGE) {
          collectFactoryImports(node, factories);
        } else if (
          bindingFileSuffixes.some((suffix) =>
            matchesFileSuffix(node.source.value, suffix),
          )
        ) {
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
            message: `UI declaration modules cannot depend on modules matching ${bindingFileSuffixes.join(", ")}.`,
          });
        }
      },
    };
  },
};

function matchesFileSuffix(modulePath, suffix) {
  const fileName = modulePath.split("/").at(-1) ?? modulePath;
  const suffixIndex = fileName.lastIndexOf(suffix);
  if (suffixIndex < 0) return false;
  const remainder = fileName.slice(suffixIndex + suffix.length);
  return remainder === "" || remainder.startsWith(".");
}

function collectFactoryImports(node, output) {
  for (const specifier of node.specifiers) {
    if (specifier.type !== "ImportSpecifier") continue;
    const imported = specifier.imported.name ?? specifier.imported.value;
    if (UI_FACTORIES.has(imported)) output.add(specifier.local.name);
  }
}
