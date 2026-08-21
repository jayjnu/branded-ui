const PACKAGE = "@jayjnu/branded-ui-react";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Keep directly referenced state components in their declared Layout slots",
    },
  },
  create(context) {
    const bindingFactories = new Set();
    const asyncFactories = new Set();
    const suspenseFactories = new Set();
    const layouts = new Set();
    const roots = new Map();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== PACKAGE) return;
        collectImports(node, new Set(["binding"]), bindingFactories);
        collectImports(node, new Set(["asyncUI"]), asyncFactories);
        collectImports(node, new Set(["suspense"]), suspenseFactories);
      },
      CallExpression(node) {
        if (isBindingDefinition(node, bindingFactories)) {
          collectBindingRoots(node.arguments[0], layouts, roots);
        }
        if (isExhaustive(node, asyncFactories)) {
          collectCaseRoots(node.arguments[2], roots);
        }
        if (
          node.callee.type === "Identifier" &&
          suspenseFactories.has(node.callee.name)
        ) {
          collectFunctionRoot(node.arguments[1], roots);
        }
      },
      JSXOpeningElement(node) {
        const access = jsxPath(node.name);
        if (!access || access.properties.at(-1) === "Layout") return;
        const slotIndex = roots.get(access.root);
        if (slotIndex === undefined) return;
        const declaredSlot = access.properties[slotIndex];
        if (!declaredSlot) return;
        const targetSlot = enclosingLayoutSlot(node, context, layouts, roots);
        if (!targetSlot || targetSlot === declaredSlot) return;
        context.report({
          node: node.name,
          message: `Component declared for slot "${declaredSlot}" is rendered in slot "${targetSlot}".`,
        });
      },
    };
  },
};

function collectImports(node, accepted, output) {
  for (const specifier of node.specifiers) {
    if (specifier.type !== "ImportSpecifier") continue;
    const imported = specifier.imported.name ?? specifier.imported.value;
    if (accepted.has(imported)) output.add(specifier.local.name);
  }
}

function collectBindingRoots(callback, layouts, roots) {
  if (!isFunction(callback)) return;
  const pattern = callback.params[0];
  if (!pattern || pattern.type !== "ObjectPattern") return;
  for (const property of pattern.properties) {
    if (
      property.type !== "Property" ||
      property.key.type !== "Identifier" ||
      property.value.type !== "Identifier"
    ) {
      continue;
    }
    const injected = property.key.name;
    const local = property.value.name;
    if (injected === "Layout") layouts.add(local);
    if (injected === "States") roots.set(local, 1);
    if (injected === "Slots" || injected === "Fallback") roots.set(local, 0);
  }
}

function collectCaseRoots(cases, roots) {
  if (!cases || cases.type !== "ObjectExpression") return;
  for (const property of cases.properties) {
    if (property.type === "Property") collectFunctionRoot(property.value, roots);
  }
}

function collectFunctionRoot(callback, roots) {
  if (!isFunction(callback)) return;
  const parameter = callback.params[0];
  if (parameter?.type === "Identifier") roots.set(parameter.name, 0);
}

function isBindingDefinition(node, factories) {
  return (
    node.callee.type === "CallExpression" &&
    node.callee.callee.type === "Identifier" &&
    factories.has(node.callee.callee.name)
  );
}

function isExhaustive(node, factories) {
  return (
    node.callee.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.object.type === "Identifier" &&
    factories.has(node.callee.object.name) &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "exhaustive"
  );
}

function enclosingLayoutSlot(node, context, layouts, roots) {
  const ancestors = context.sourceCode.getAncestors(node);
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const attribute = ancestors[index];
    if (
      attribute.type !== "JSXAttribute" ||
      attribute.name.type !== "JSXIdentifier"
    ) {
      continue;
    }
    for (let parentIndex = index - 1; parentIndex >= 0; parentIndex -= 1) {
      const parent = ancestors[parentIndex];
      if (parent.type !== "JSXOpeningElement") continue;
      if (isLayout(parent.name, layouts, roots)) return attribute.name.name;
      break;
    }
  }
  return undefined;
}

function isLayout(name, layouts, roots) {
  const access = jsxPath(name);
  if (!access) return false;
  if (access.properties.length === 0) return layouts.has(access.root);
  return access.properties.at(-1) === "Layout" && roots.has(access.root);
}

function jsxPath(node) {
  if (node.type === "JSXIdentifier") {
    return { root: node.name, properties: [] };
  }
  if (
    node.type !== "JSXMemberExpression" ||
    node.property.type !== "JSXIdentifier"
  ) {
    return undefined;
  }
  const parent = jsxPath(node.object);
  return parent
    ? { root: parent.root, properties: [...parent.properties, node.property.name] }
    : undefined;
}

function isFunction(node) {
  return (
    node?.type === "ArrowFunctionExpression" ||
    node?.type === "FunctionExpression"
  );
}
