import path from "node:path";
import ts from "typescript";

export type BrandedUIDiagnostic = {
  readonly code: "BUI001" | "BUI002" | "BUI003";
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
};

type Role = "PureUI" | "LayoutUI" | "SyncUISet" | "AsyncUISet" | "Binding";

const rolesByFactory: Readonly<Record<string, Role>> = {
  pureUI: "PureUI",
  layoutUI: "LayoutUI",
  syncUI: "SyncUISet",
  asyncUI: "AsyncUISet",
  binding: "Binding",
};
const declarationRoles = new Set<Role>([
  "PureUI",
  "LayoutUI",
  "SyncUISet",
  "AsyncUISet",
]);

export function checkProject(configPath: string): readonly BrandedUIDiagnostic[] {
  const absoluteConfigPath = path.resolve(configPath);
  const config = ts.readConfigFile(absoluteConfigPath, ts.sys.readFile);
  if (config.error) throw new Error(formatTypeScriptError(config.error));

  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    path.dirname(absoluteConfigPath),
  );
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map(formatTypeScriptError).join("\n"));
  }

  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const projectFiles = new Set(parsed.fileNames.map(normalize));
  const sourceFiles = program
    .getSourceFiles()
    .filter(
      (sourceFile) =>
        !sourceFile.isDeclarationFile && projectFiles.has(normalize(sourceFile.fileName)),
    );
  const roles = new Map<string, Set<Role>>();
  const diagnostics: BrandedUIDiagnostic[] = [];

  for (const sourceFile of sourceFiles) {
    const fileRoles = new Set<Role>();
    visit(sourceFile, (node) => {
      if (!ts.isCallExpression(node)) return;
      const role = rolesByFactory[factoryName(node.expression, checker) ?? ""];
      if (role) fileRoles.add(role);
    });
    roles.set(normalize(sourceFile.fileName), fileRoles);
  }

  for (const sourceFile of sourceFiles) {
    checkSlots(sourceFile, checker, diagnostics);
    checkRawExports(sourceFile, diagnostics);
    checkDependencies(sourceFile, parsed.options, roles, diagnostics);
  }

  return diagnostics.filter(
    (diagnostic, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.code === diagnostic.code &&
          candidate.file === diagnostic.file &&
          candidate.line === diagnostic.line &&
          candidate.column === diagnostic.column,
      ) === index,
  );
}

function checkSlots(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  diagnostics: BrandedUIDiagnostic[],
) {
  const roots = new Map<ts.Symbol, number>();
  const layouts = new Set<ts.Symbol>();

  visit(sourceFile, (node) => {
    if (ts.isCallExpression(node) && isBindingDefinition(node, checker)) {
      const callback = node.arguments[0];
      if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
        const parameter = callback.parameters[0]?.name;
        if (parameter && ts.isObjectBindingPattern(parameter)) {
          for (const element of parameter.elements) {
            if (!ts.isIdentifier(element.name)) continue;
            const injectedName = bindingElementName(element);
            const symbol = checker.getSymbolAtLocation(element.name);
            if (!symbol) continue;
            if (injectedName === "Layout") layouts.add(symbol);
            if (injectedName === "States") roots.set(symbol, 1);
            if (injectedName === "Slots" || injectedName === "Fallback") {
              roots.set(symbol, 0);
            }
          }
        }
      }
    }

    if (ts.isCallExpression(node) && isAsyncExhaustive(node, checker)) {
      collectCallbackRoots(node.arguments[2], checker, roots);
    }

    if (ts.isCallExpression(node) && factoryName(node.expression, checker) === "suspense") {
      collectCallbackRoots(node.arguments[1], checker, roots);
    }
  });

  visit(sourceFile, (node) => {
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : undefined;
    if (!opening || !isLayoutTag(opening.tagName, checker, roots, layouts)) return;

    for (const attribute of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attribute) || !ts.isIdentifier(attribute.name)) continue;
      if (!attribute.initializer || !ts.isJsxExpression(attribute.initializer)) continue;
      const expression = attribute.initializer.expression;
      if (!expression) continue;
      const targetSlot = attribute.name.text;

      visit(expression, (child) => {
        const tagName = ts.isJsxElement(child)
          ? child.openingElement.tagName
          : ts.isJsxSelfClosingElement(child)
            ? child.tagName
            : undefined;
        if (!tagName) return;
        const access = accessPath(tagName);
        if (!access || access.properties.at(-1) === "Layout") return;
        const symbol = checker.getSymbolAtLocation(access.root);
        const slotIndex = symbol ? roots.get(symbol) : undefined;
        if (slotIndex === undefined) return;
        const declaredSlot = access.properties[slotIndex];
        if (!declaredSlot || declaredSlot === targetSlot) return;
        addDiagnostic(
          diagnostics,
          sourceFile,
          tagName,
          "BUI001",
          `Component declared for slot "${declaredSlot}" is rendered in slot "${targetSlot}".`,
        );
      });
    }
  });
}

function checkDependencies(
  sourceFile: ts.SourceFile,
  options: ts.CompilerOptions,
  roles: ReadonlyMap<string, ReadonlySet<Role>>,
  diagnostics: BrandedUIDiagnostic[],
) {
  const sourceRoles = roles.get(normalize(sourceFile.fileName));
  if (!sourceRoles || ![...sourceRoles].some((role) => declarationRoles.has(role))) {
    return;
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const resolved = ts.resolveModuleName(
      statement.moduleSpecifier.text,
      sourceFile.fileName,
      options,
      ts.sys,
    ).resolvedModule?.resolvedFileName;
    if (!resolved || !roles.get(normalize(resolved))?.has("Binding")) continue;
    addDiagnostic(
      diagnostics,
      sourceFile,
      statement.moduleSpecifier,
      "BUI002",
      "UI declaration modules cannot depend on Binding modules.",
    );
  }
}

function checkRawExports(
  sourceFile: ts.SourceFile,
  diagnostics: BrandedUIDiagnostic[],
) {
  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) continue;

    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      isPascalCase(statement.name.text)
    ) {
      addDiagnostic(
        diagnostics,
        sourceFile,
        statement.name,
        "BUI003",
        `Exported component "${statement.name.text}" must use a Branded UI factory.`,
      );
    }

    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        !isPascalCase(declaration.name.text) ||
        !declaration.initializer ||
        (!ts.isArrowFunction(declaration.initializer) &&
          !ts.isFunctionExpression(declaration.initializer) &&
          !isRawComponentWrapper(declaration.initializer))
      ) {
        continue;
      }
      addDiagnostic(
        diagnostics,
        sourceFile,
        declaration.name,
        "BUI003",
        `Exported component "${declaration.name.text}" must use a Branded UI factory.`,
      );
    }
  }
}

function isRawComponentWrapper(expression: ts.Expression) {
  return (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    (expression.expression.text === "forwardRef" || expression.expression.text === "memo")
  );
}

function factoryName(
  expression: ts.LeftHandSideExpression,
  checker: ts.TypeChecker,
): string | undefined {
  if (!ts.isIdentifier(expression)) return undefined;
  const declaration = checker.getSymbolAtLocation(expression)?.declarations?.find(
    ts.isImportSpecifier,
  );
  if (!declaration) return undefined;
  const importDeclaration = declaration.parent.parent.parent;
  if (
    !ts.isImportDeclaration(importDeclaration) ||
    !ts.isStringLiteral(importDeclaration.moduleSpecifier) ||
    importDeclaration.moduleSpecifier.text !== "@jayjnu/branded-ui-react"
  ) {
    return undefined;
  }
  return declaration.propertyName?.text ?? declaration.name.text;
}

function isBindingDefinition(node: ts.CallExpression, checker: ts.TypeChecker) {
  return (
    ts.isCallExpression(node.expression) &&
    factoryName(node.expression.expression, checker) === "binding"
  );
}

function isAsyncExhaustive(node: ts.CallExpression, checker: ts.TypeChecker) {
  return (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "exhaustive" &&
    factoryName(node.expression.expression, checker) === "asyncUI"
  );
}

function collectCallbackRoots(
  node: ts.Node | undefined,
  checker: ts.TypeChecker,
  roots: Map<ts.Symbol, number>,
) {
  if (!node) return;
  if (ts.isObjectLiteralExpression(node)) {
    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        collectCallbackRoots(property.initializer, checker, roots);
      }
    }
    return;
  }
  if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return;
  const parameter = node.parameters[0]?.name;
  if (!parameter || !ts.isIdentifier(parameter)) return;
  const symbol = checker.getSymbolAtLocation(parameter);
  if (symbol) roots.set(symbol, 0);
}

function bindingElementName(element: ts.BindingElement) {
  if (element.propertyName && ts.isIdentifier(element.propertyName)) {
    return element.propertyName.text;
  }
  return ts.isIdentifier(element.name) ? element.name.text : undefined;
}

function isLayoutTag(
  tagName: ts.JsxTagNameExpression,
  checker: ts.TypeChecker,
  roots: ReadonlyMap<ts.Symbol, number>,
  layouts: ReadonlySet<ts.Symbol>,
) {
  if (ts.isIdentifier(tagName)) {
    const symbol = checker.getSymbolAtLocation(tagName);
    return !!symbol && layouts.has(symbol);
  }
  const access = accessPath(tagName);
  if (!access || access.properties.at(-1) !== "Layout") return false;
  const symbol = checker.getSymbolAtLocation(access.root);
  return !!symbol && roots.has(symbol);
}

function accessPath(node: ts.Node): { root: ts.Identifier; properties: string[] } | undefined {
  if (ts.isIdentifier(node)) return { root: node, properties: [] };
  if (!ts.isPropertyAccessExpression(node)) return undefined;
  const parent = accessPath(node.expression);
  return parent
    ? { root: parent.root, properties: [...parent.properties, node.name.text] }
    : undefined;
}

function addDiagnostic(
  diagnostics: BrandedUIDiagnostic[],
  sourceFile: ts.SourceFile,
  node: ts.Node,
  code: BrandedUIDiagnostic["code"],
  message: string,
) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  diagnostics.push({
    code,
    file: sourceFile.fileName,
    line: position.line + 1,
    column: position.character + 1,
    message,
  });
}

function visit(node: ts.Node, callback: (node: ts.Node) => void) {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function hasExportModifier(node: ts.Node) {
  return ts.canHaveModifiers(node)
    ? ts.getModifiers(node)?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) ?? false
    : false;
}

function isPascalCase(value: string) {
  return /^[A-Z]/.test(value);
}

function normalize(fileName: string) {
  return path.normalize(fileName);
}

function formatTypeScriptError(diagnostic: ts.Diagnostic) {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}
