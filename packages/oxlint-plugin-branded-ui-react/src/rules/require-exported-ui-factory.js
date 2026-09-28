const PACKAGE = "@jayjnu/branded-ui-react";
const FACTORIES = ["pureUI", "syncUI", "asyncUI", "layoutUI", "binding"];

export default {
  meta: {
    type: "problem",
    docs: { description: "Require a named export declared with the configured Branded UI factory" },
    schema: [
      {
        type: "object",
        properties: {
          factory: { enum: FACTORIES },
          namePattern: { type: "string" },
          minimum: { type: "integer", minimum: 1 },
        },
        required: ["factory"],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { factory, namePattern, minimum = 1 } = context.options[0];
    let pattern;
    try {
      pattern = namePattern === undefined ? null : new RegExp(namePattern);
    } catch {
      return {
        Program(node) {
          context.report({ node, message: `Invalid namePattern: ${namePattern}.` });
        },
      };
    }

    return {
      Program(program) {
        const imports = new Map();
        const declarations = new Map();
        const exports = [];
        for (const statement of program.body) {
          if (statement.type === "ImportDeclaration" && statement.source.value === PACKAGE) {
            for (const specifier of statement.specifiers) {
              if (specifier.type !== "ImportSpecifier" || specifier.importKind === "type") continue;
              const imported = specifier.imported.name ?? specifier.imported.value;
              if (FACTORIES.includes(imported)) imports.set(specifier.local.name, imported);
            }
          }
          if (statement.type === "ExportNamedDeclaration") {
            if (!statement.source && statement.exportKind !== "type") {
              for (const specifier of statement.specifiers) {
                if (specifier.type !== "ExportSpecifier" || specifier.exportKind === "type") continue;
                exports.push({ local: specifier.local.name, name: specifier.exported.name ?? specifier.exported.value });
              }
            }
          }
          const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
          if (declaration?.type !== "VariableDeclaration") continue;
          for (const item of declaration.declarations) {
            if (item.id.type !== "Identifier") continue;
            declarations.set(item.id.name, item);
            if (statement.type === "ExportNamedDeclaration" && statement.exportKind !== "type") {
              exports.push({ local: item.id.name, name: item.id.name });
            }
          }
        }

        let valid = 0;
        let wrong = 0;
        const seen = new Set();
        for (const entry of exports) {
          if (seen.has(entry.name) || (pattern && !pattern.test(entry.name))) continue;
          seen.add(entry.name);
          const item = declarations.get(entry.local);
          if (!item) continue;
          const actual = item.init?.type === "CallExpression" && item.init.callee.type === "Identifier"
            ? imports.get(item.init.callee.name)
            : undefined;
          if (actual === factory) {
            valid++;
          } else {
            wrong++;
            context.report({
              node: item.id,
              message: actual
                ? `${entry.name} must use ${factory}, not ${actual}.`
                : `${entry.name} must be declared with ${factory}().`,
            });
          }
        }
        if (valid + wrong < minimum) {
          context.report({
            node: program,
            message: `This module must export at least ${minimum} ${factory} contract${minimum === 1 ? "" : "s"}${namePattern === undefined ? "" : ` matching /${namePattern}/`}.`,
          });
        }
      },
    };
  },
};
