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
    "branded-ui-react/no-external-call-in-pure-ui": "error",
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

| Rule                          | Checks                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `correct-slot`                | A directly referenced `States`, `Slots`, exhaustive-case, or Suspense fallback component stays in its declared Layout slot.      |
| `no-binding-import-in-ui`     | A module declaring `pureUI`, `layoutUI`, `syncUI`, or `asyncUI` does not import a file matching the configured Binding suffixes. |
| `no-external-call-in-pure-ui` | Calls and constructors inside inline Pure UI declarations are rooted in props or local bindings, or explicitly allowlisted.     |
| `no-hook-call-in-pure-ui`     | Hook-shaped calls inside inline Pure UI declarations are kept outside the declarative UI layer.                                  |
| `no-raw-component-export`     | Exported PascalCase function components use a Branded UI factory instead of a raw function, `memo`, or `forwardRef`.             |

### `no-external-call-in-pure-ui`

A Pure UI component should get application state and actions through props. This rule checks inline components declared through:

- `pureUI(component)`
- `layoutUI({ component })`
- `syncUI({ slots })`
- `asyncUI({ states, fallback })`, including states wrapped in `asyncUI.states()`

Slot components returned by `syncUI` and `asyncUI` carry the `PureUI` brand, so they follow the same call rules as a standalone `pureUI` component. Layout components follow the same rule because they are also part of the declarative UI layer.

The rule rejects calls whose root is outside the component function. It also checks nested callbacks, so moving an external call into an event handler does not bypass the rule.

```tsx
import { useContext } from "react";
import { client } from "./client";

export const ProfileUI = pureUI(({ userId }) => {
  const locale = useContext(LocaleContext); // error
  const profile = client.getProfile(userId); // error

  return <ProfileCard locale={locale} profile={profile} />;
});
```

Hooks, API clients, stores, browser globals, and constructors are external unless configured otherwise. Move application behavior to a Binding and pass its result into Pure UI:

```tsx
export const ProfileUI = pureUI(({ locale, profile, onRefresh }) => (
  <ProfileCard locale={locale} profile={profile} onRefresh={onRefresh} />
));
```

The following calls are local and need no configuration:

- functions and methods received through props
- methods rooted in a prop or a variable declared inside the `pureUI` callback
- functions declared inside the callback
- nested callback parameters

```tsx
export const TagsUI = pureUI(({ tags, onSelect }) => {
  const label = tags.map((tag) => tag.trim()).join(", ");
  return <button onClick={() => onSelect(label)}>{label}</button>;
});
```

The rule has no default external allowlist. Add deterministic utilities that cannot reasonably arrive through props with `allowedCalls`:

```json
{
  "rules": {
    "branded-ui-react/no-external-call-in-pure-ui": [
      "error",
      { "allowedCalls": ["formatDate", "Math.max", "Intl.DateTimeFormat"] }
    ]
  }
}
```

For gradual adoption, use `no-hook-call-in-pure-ui` to report only hook-shaped calls (`useState`, `useEffect`, `useForm`, and similar), leaving helpers and constructors alone. Both call rules support:

- `allowedCallPatterns` and `deniedCallPatterns` for regular expressions matched against the full callee name. Deny patterns take precedence over allowlists.
- `allowedModules` and `deniedModules` for imported calls. These use module globs, so `@/shared/ui/**` matches every import below that path.

For example, this bans hooks first while allowing UI-owned translations:

```json
{
  "rules": {
    "branded-ui-react/no-hook-call-in-pure-ui": [
      "warn",
      { "allowedCallPatterns": ["^use.*Translation$"] }
    ]
  }
}
```

Names use the spelling at the call site. If `formatDate` is imported as `format`, allow `format`. Exact `allowedCalls` entries remain supported; package names and wildcards belong in the module options.

### `no-hook-call-in-pure-ui`

This is the focused version of `no-external-call-in-pure-ui`. It reports hook-shaped calls but ignores non-hook helpers and constructors, so teams can adopt the hook boundary without first classifying every presentation helper. It accepts the same allow/deny call and module options.

### Custom Binding filenames

The default Binding filename suffix is `.binding`. Override it when a project uses another convention:

```json
{
  "rules": {
    "branded-ui-react/no-binding-import-in-ui": [
      "error",
      {
        "bindingFileSuffixes": [".binding", ".container", ".controller"]
      }
    ]
  }
}
```

A suffix matches both extensionless imports such as `./Orders.binding` and imports with a source extension such as `./Orders.binding.tsx`.

## Source layout

```text
src/
├── index.js
├── recommended.js
└── rules/
    ├── correct-slot.js
    ├── no-binding-import-in-ui.js
    ├── no-external-call-in-pure-ui.js
    ├── no-hook-call-in-pure-ui.js
    └── no-raw-component-export.js
```

## Limitations

These rules intentionally use Oxlint's file-local AST and are not type-aware.

- `correct-slot` only follows direct member expressions such as `Success.content.List`. It does not recover provenance after assigning, destructuring, returning, or re-exporting a component under another name.
- `no-binding-import-in-ui` recognizes direct imports matching `bindingFileSuffixes`. It does not inspect barrels, dynamic imports, or the role declared inside another file.
- `no-external-call-in-pure-ui` and `no-hook-call-in-pure-ui` are lexical. They check inline functions in supported Branded UI declarations; they do not inspect a component or contract section passed by identifier. Module policies only inspect direct imports, and the rules do not follow general aliases or helper bodies declared outside the component, or reject external value reads that are not calls.
- `no-raw-component-export` treats exported PascalCase functions as React components. It can flag a PascalCase non-component function and does not recognize component-producing wrappers other than `memo` and `forwardRef`.
- Lexically shadowing an injected name can reduce rule accuracy because the plugin does not have TypeScript symbol identity.
- The plugin does not detect transitive dependencies, role cycles, or project-wide composition violations.

TypeScript contracts remain responsible for props, states, fallback identity, and exhaustive Binding proofs. Cross-file semantic checks require a future type-aware analyzer or Language Service integration.
