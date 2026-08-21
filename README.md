# Branded UI

[English](README.md) | [한국어](README.ko.md)

## What is Branded UI?

Branded UI is a small, type-level contract layer for regular UI components. The contracts identify presentation components and layout slots. They also define the available view states and the point where application behavior enters.

Branded UI does not prescribe a renderer, state manager, data client, styling system, or component library. Its core roles are framework-neutral. An adapter maps them to a framework's existing component model.

## Status

Branded UI is experimental and its API may change before `1.0`.

## How Branded UI works

Declare the presentation contract without data access or application state:

```tsx
// Orders.ui.tsx
const OrdersLayout = layoutUI({
  component: ({ content }: { content: ReactNode }) => <section>{content}</section>,
  slots: ["content"],
});

export const OrdersUI = asyncUI({
  layout: OrdersLayout,
  states: asyncUI.states({
    success: {
      content: {
        List: ({ orders }: { orders: readonly Order[] }) => (
          <ul>{orders.map((order) => <li key={order.id}>{order.name}</li>)}</ul>
        ),
      },
    },
    empty: { content: { Message: () => <p>No orders yet.</p> } },
    pending: { content: { Message: () => <p>Loading orders…</p> } },
    failed: { content: { Message: () => <p>Could not load orders.</p> } },
  }),
});
```

Put hooks, data access, and state transitions in a Binding. The Binding receives the declared layout and states, and must handle every state:

```tsx
// Orders.binding.tsx
export const Orders = binding(OrdersUI)(({ Layout, States }) => {
  return function OrdersBinding() {
    const { state, orders } = useOrders();

    return asyncUI.exhaustive(state, States, {
      success: (Success) => (
        <Layout content={<Success.content.List orders={orders} />} />
      ),
      empty: (Empty) => <Layout content={<Empty.content.Message />} />,
      pending: (Pending) => <Layout content={<Pending.content.Message />} />,
      failed: (Failed) => <Layout content={<Failed.content.Message />} />,
    });
  };
});
```

The contract can also render an isolated scenario without recreating the data layer:

```tsx
// Orders.scenario.tsx — import this component from stories and tests
const Layout = OrdersUI.layout.component;
const Pending = OrdersUI.states.pending;

export const PendingOrders = pureUI(() => (
  <Layout content={<Pending.content.Message />} />
));
```

TypeScript rejects missing states, invalid slots, incompatible props, and components assigned to the wrong role. The optional Oxlint plugin catches file-level problems, including UI modules that import Bindings and components placed in the wrong layout slot. Storybook and tests render the same contract. CI and pre-commit hooks keep checking it.

## Example

[`examples/react-vite-oxlint`](examples/react-vite-oxlint) demonstrates nested Bindings, TanStack Query, Suspense, Error Boundaries, and Oxlint integration.

## Core concepts

These roles split a feature into a functional core and an imperative shell:

| Concept | Responsibility |
| --- | --- |
| **Pure UI** | A presentation component whose data and actions arrive through explicit props. |
| **Layout** | A structural component with named slots that define where UI may be composed. |
| **Sync UI** | One layout and one complete set of components for synchronous UI. |
| **Async UI** | One layout, explicit state-specific component sets, and an optional Suspense fallback. |
| **Binding** | The shell that consumes an exact UI contract and owns hooks, data access, effects, and state transitions. |
| **Brand** | Compile-time evidence that preserves each role and prevents accidental substitution or re-declaration. |

### Why branded types?

TypeScript is structurally typed, so values with the same shape are interchangeable. A UI role needs an identity beyond its shape. A branded type adds a hidden `unique symbol` marker:

```ts
declare const role: unique symbol;
type Branded<Value, Role> = Value & { readonly [role]: Role };
```

The marker exists only in the type system. TypeScript can therefore tell `PureUI`, `LayoutUI`, and `Binding` apart even when the underlying values are regular components. The contracts can reject a component used or re-declared in the wrong role.

A brand adds no renderer or runtime wrapper. Applications keep composing framework components as usual; the type carries the architectural role.

## Packages

| Package | Purpose | Documentation |
| --- | --- | --- |
| [`@jayjnu/branded-ui`](packages/core) | Framework-neutral role contracts | Source package |
| [`@jayjnu/branded-ui-react`](packages/react) | React factories, Bindings, exhaustive state matching, and Suspense composition | [React guide](packages/react/README.md) |
| [`@jayjnu/oxlint-plugin-branded-ui-react`](packages/oxlint-plugin-branded-ui-react) | Optional architecture rules for React projects | [Plugin guide](packages/oxlint-plugin-branded-ui-react/README.md) |

## Why these contracts?

### Pure UI is deterministic

Pure UI produces the same output for the same input. That makes it easier to understand, test, reuse, and render in isolation. React does not enforce this boundary. Context and Hooks make application behavior available anywhere, so teams often leave the split between presentation and behavior to convention.

A UI component usually appears in the application, Storybook, and tests. If a leaf component fetches data or reads hidden application state, the other two environments must reproduce those dependencies. The initial convenience turns into coupling that is hard to maintain.

### AI agents need machine-verifiable boundaries

AI agents make code cheaper to produce and more expensive to verify. Code written across separate sessions still has to compose correctly and hold up as the project grows. The architecture therefore needs to live in code, not only in a developer's memory or in prose.

Agents can also generate many components and state variants in one session. A person needs Storybook or another isolated viewer to inspect each meaningful scenario and return to it later.

Branded types record the roles of presentation components, layouts, states, and Bindings. TypeScript checks how they compose. Optional lint rules check file boundaries that types cannot see. Running both in CI or a pre-commit hook gives an agent a concrete error when it breaks a rule.

## Design principles

### Functional Core, Imperative Shell

The UI declaration is the functional core. It receives props and describes layouts and view states without reading from the application environment. The same input produces the same UI.

The Binding is the imperative shell. It owns hooks, API calls, effects, and state transitions. It turns external changes into inputs and a finite UI state for the core. Application behavior can remain imperative while presentation stays deterministic.

### SOLID expressed as UI contracts

The contracts map several SOLID principles to UI components:

- Single Responsibility separates rendering, layout, and application behavior into Pure UI, Layout, and Binding. Each role changes for a different reason.
- Dependency Inversion makes Bindings depend on a UI contract. Presentation components do not know which API client, state manager, or application context supplied their props.
- Interface Segregation uses named slots to expose only the places a Binding may compose.
- State is data. States are declared as values and matched exhaustively instead of being spread across conditional branches.
- Composition takes the place of inheritance. Branded UI keeps the framework's component model and adds role information without adding a rendering abstraction.
- Technology choices stay outside the contract. Frameworks, component libraries, state managers, data clients, and styling tools can change without changing the UI roles.
- Type and lint checks report boundary violations to both developers and AI agents.

## License

[MIT](LICENSE)
