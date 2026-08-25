const PACKAGE = "@jayjnu/branded-ui-react";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require external calls in Pure UI components to be allowlisted",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedCalls: {
            type: "array",
            items: { type: "string", minLength: 1 },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ allowedCalls: [] }],
  },
  create(context) {
    const allowedCalls = new Set(context.options[0]?.allowedCalls ?? []);
    const factories = new Map();
    // ponytail: lexical only; use a type-aware analyzer if aliases must be followed.
    const callbacks = new WeakSet();
    const active = [];
    const candidates = [];

    function enterFunction(node) {
      if (callbacks.has(node)) active.push({ node, locals: new Set() });
      const current = active.at(-1);
      if (!current) return;
      if (node.id) collectNames(node.id, current.locals);
      for (const parameter of node.params) collectNames(parameter, current.locals);
    }

    function exitFunction(node) {
      if (active.at(-1)?.node === node) active.pop();
    }

    function inspect(node, kind) {
      const current = active.at(-1);
      if (!current || isInlineFunction(node.callee)) return;
      candidates.push({ node, kind, locals: current.locals });
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== PACKAGE) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const imported = specifier.imported.name ?? specifier.imported.value;
          if (["pureUI", "layoutUI", "syncUI", "asyncUI"].includes(imported)) {
            factories.set(specifier.local.name, imported);
          }
        }
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier") {
          collectInlineComponents(
            factories.get(node.callee.name),
            node.arguments[0],
            callbacks,
          );
        }
        inspect(node, "Call");
      },
      NewExpression: (node) => inspect(node, "Constructor"),
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      FunctionDeclaration(node) {
        const current = active.at(-1);
        if (current && node.id) collectNames(node.id, current.locals);
        enterFunction(node);
      },
      "FunctionDeclaration:exit": exitFunction,
      VariableDeclarator(node) {
        const current = active.at(-1);
        if (current) collectNames(node.id, current.locals);
      },
      ClassDeclaration(node) {
        const current = active.at(-1);
        if (current && node.id) collectNames(node.id, current.locals);
      },
      CatchClause(node) {
        const current = active.at(-1);
        if (current && node.param) collectNames(node.param, current.locals);
      },
      "Program:exit"() {
        for (const { node, kind, locals } of candidates) {
          const root = calleeRoot(node.callee);
          const name = calleeName(node.callee);
          if ((root && locals.has(root)) || (name && allowedCalls.has(name))) {
            continue;
          }
          context.report({
            node: node.callee,
            message: `${kind} "${name ?? "<expression>"}" is external to Pure UI. Pass it through props or add it to allowedCalls.`,
          });
        }
      },
    };
  },
};

function collectInlineComponents(factory, input, output) {
  if (factory === "pureUI") {
    addComponent(input, output);
    return;
  }
  if (factory === "layoutUI") {
    addComponent(propertyValue(input, "component"), output);
    return;
  }
  if (factory === "syncUI") {
    collectSlots(propertyValue(input, "slots"), output);
    return;
  }
  if (factory !== "asyncUI") return;

  let states = unwrap(propertyValue(input, "states"));
  if (states?.type === "CallExpression") states = states.arguments[0];
  forEachPropertyValue(states, (state) => collectSlots(state, output));
  collectSlots(
    propertyValue(propertyValue(input, "fallback"), "slots"),
    output,
  );
}

function collectSlots(slots, output) {
  forEachPropertyValue(slots, (components) => {
    forEachPropertyValue(components, (component) => addComponent(component, output));
  });
}

function addComponent(node, output) {
  node = unwrap(node);
  if (
    node?.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    (node.callee.name === "memo" || node.callee.name === "forwardRef")
  ) {
    node = unwrap(node.arguments[0]);
  }
  if (isFunction(node)) output.add(node);
}

function propertyValue(node, name) {
  node = unwrap(node);
  if (node?.type !== "ObjectExpression") return undefined;
  for (const property of node.properties) {
    if (property.type !== "Property") continue;
    const key = property.key.name ?? property.key.value;
    if (key === name) return property.value;
  }
  return undefined;
}

function forEachPropertyValue(node, visit) {
  node = unwrap(node);
  if (node?.type !== "ObjectExpression") return;
  for (const property of node.properties) {
    if (property.type === "Property") visit(property.value);
  }
}

function collectNames(pattern, output) {
  if (pattern.type === "Identifier") {
    output.add(pattern.name);
    return;
  }
  if (pattern.type === "RestElement") {
    collectNames(pattern.argument, output);
    return;
  }
  if (pattern.type === "AssignmentPattern") {
    collectNames(pattern.left, output);
    return;
  }
  if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      collectNames(property.type === "RestElement" ? property.argument : property.value, output);
    }
    return;
  }
  if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) {
      if (element) collectNames(element, output);
    }
  }
}

function calleeRoot(node) {
  node = unwrap(node);
  if (node?.type === "Identifier") return node.name;
  if (node?.type === "MemberExpression") return calleeRoot(node.object);
  if (node?.type === "CallExpression") return calleeRoot(node.callee);
  return undefined;
}

function calleeName(node) {
  node = unwrap(node);
  if (node?.type === "Identifier") return node.name;
  if (node?.type === "CallExpression") return calleeName(node.callee);
  if (node?.type !== "MemberExpression") return undefined;
  const object = calleeName(node.object);
  const property = node.computed
    ? node.property.type === "Literal"
      ? String(node.property.value)
      : undefined
    : node.property.name;
  return object && property ? `${object}.${property}` : undefined;
}

function unwrap(node) {
  while (
    node &&
    (node.type === "ChainExpression" ||
      node.type === "TSAsExpression" ||
      node.type === "TSNonNullExpression" ||
      node.type === "TSSatisfiesExpression" ||
      node.type === "TSTypeAssertion")
  ) {
    node = node.expression;
  }
  return node;
}

function isInlineFunction(node) {
  node = unwrap(node);
  return isFunction(node);
}

function isFunction(node) {
  return node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";
}
