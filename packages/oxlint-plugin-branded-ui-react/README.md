# @jayjnu/oxlint-plugin-branded-ui-react

Fast, file-local architecture rules for `@jayjnu/branded-ui-react`.

## Install

```sh
pnpm add -D oxlint @jayjnu/oxlint-plugin-branded-ui-react
```

## Configure

```json
{
  "jsPlugins": ["@jayjnu/oxlint-plugin-branded-ui-react"],
  "rules": {
    "branded-ui-react/correct-slot": "error",
    "branded-ui-react/no-binding-import-in-ui": "error",
    "branded-ui-react/no-raw-component-export": "error"
  }
}
```

For TypeScript Oxlint configuration, the same rule map is exported as `recommended`.

```ts
import { recommended } from "@jayjnu/oxlint-plugin-branded-ui-react";
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["@jayjnu/oxlint-plugin-branded-ui-react"],
  rules: recommended,
});
```

## Rules

| Rule | Checks |
| --- | --- |
| `correct-slot` | A directly referenced `States`, `Slots`, exhaustive-case, or Suspense fallback component stays in its declared Layout slot. |
| `no-binding-import-in-ui` | A module declaring `pureUI`, `layoutUI`, `syncUI`, or `asyncUI` does not import a `.binding` module. |
| `no-raw-component-export` | Exported PascalCase function components use a Branded UI factory instead of a raw function, `memo`, or `forwardRef`. |

## Source layout

```text
src/
├── index.js
├── recommended.js
└── rules/
    ├── correct-slot.js
    ├── no-binding-import-in-ui.js
    └── no-raw-component-export.js
```

## Limitations

These rules intentionally use Oxlint's file-local AST and are not type-aware.

- `correct-slot` only follows direct member expressions such as `Success.content.List`. It does not recover provenance after assigning, destructuring, returning, or re-exporting a component under another name.
- `no-binding-import-in-ui` recognizes relative import paths ending in `.binding`. It does not inspect barrels, custom filenames, dynamic imports, or the role declared inside another file.
- `no-raw-component-export` treats exported PascalCase functions as React components. It can flag a PascalCase non-component function and does not recognize component-producing wrappers other than `memo` and `forwardRef`.
- Lexically shadowing an injected name can reduce rule accuracy because the plugin does not have TypeScript symbol identity.
- The plugin does not detect transitive dependencies, role cycles, or project-wide composition violations.

TypeScript contracts remain responsible for props, states, fallback identity, and exhaustive Binding proofs. Cross-file semantic checks require a future type-aware analyzer or Language Service integration.
