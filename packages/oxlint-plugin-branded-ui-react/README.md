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

## Scope

These rules intentionally use Oxlint's file-local AST. They do not follow component aliases, barrel re-exports, or cross-file TypeScript symbol identity. Type contracts remain responsible for props, states, fallback identity, and exhaustive Binding proofs.
