# Branded UI

[English](README.md) | [한국어](README.ko.md)

## What is Branded UI?

Branded UI is a small, type-first contract layer around ordinary UI components. It keeps presentation declarations separate from application behavior, makes meaningful states explicit, and preserves those roles through composition without introducing a new rendering system.

## Why?

Pure UI is deterministic: given the same inputs, it produces the same output. That makes UI a functional core that is easier to understand, test, reuse, and render in isolation. React, however, does not enforce this boundary. As Context and Hooks made it convenient to access behavior from anywhere, the distinction between presentation components and behavior-owning components became a convention left to each developer.

Every UI component has at least three consumers: the application, an isolated showcase such as Storybook, and tests. A leaf component that loads data or depends on hidden application state may be convenient at first, but every other consumer must then reproduce that environment. Without an explicit boundary, reuse becomes coupling and maintenance becomes expensive.

AI agents change this trade-off. Generating code is now cheap; verifying that independently generated code remains correct, composable, and scalable is the expensive part. Architectural intent therefore needs to be machine-readable rather than held in a developer's memory or described only in prose.

Visual verification changes with it. An isolated showcase is no longer a nice-to-have when an agent can generate many components and state variants in one session. Each meaningful scenario needs a visible, repeatable representation so a human can review what was produced.

Branded UI turns these boundaries into contracts. Compile-time brands define the roles of presentation components, layouts, states, and behavior-owning Bindings. TypeScript checks their composition, while optional lint rules cover file-level boundaries that types cannot see. Run those checks in CI or a pre-commit hook and an agent receives immediate, mechanical feedback when it violates the architecture.

## How Branded UI solves it

First, declare the complete presentation contract without data access or application state:

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

Then put hooks, data access, and state transitions in a Binding. The declared layout and states are injected, and every state must be handled:

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

The same contract can render an isolated scenario without recreating the data layer:

```tsx
// Orders.scenario.tsx — import this component from stories and tests
const Layout = OrdersUI.layout.component;
const Pending = OrdersUI.states.pending;

export const PendingOrders = pureUI(() => (
  <Layout content={<Pending.content.Message />} />
));
```

TypeScript now rejects missing states, invalid slots, incompatible props, and components used in the wrong branded role. The optional Oxlint plugin adds file-level checks such as UI modules importing Bindings or components being placed in the wrong layout slot. Storybook and tests render the same explicit contract; CI and pre-commit hooks enforce it instead of relying on developer discipline.

## Core concepts

Branded UI models a feature as a functional core surrounded by a behavior-owning shell:

| Concept | Responsibility |
| --- | --- |
| **Pure UI** | A presentation component whose data and actions arrive through explicit props. |
| **Layout** | A structural component with named slots that define where UI may be composed. |
| **Sync UI** | One layout and one complete set of components for synchronous UI. |
| **Async UI** | One layout, explicit state-specific component sets, and an optional Suspense fallback. |
| **Binding** | The shell that consumes an exact UI contract and owns hooks, data access, effects, and state transitions. |
| **Brand** | Compile-time evidence that preserves each role and prevents accidental substitution or re-declaration. |

Brands do not introduce another renderer. At runtime, applications still compose ordinary framework components; the brand gives TypeScript architectural information that their structural types do not carry.

## Design principles

- **Functional core, behavior-owning shell.** Keep presentation deterministic and move environmental dependencies to Bindings.
- **Explicit inputs over hidden dependencies.** Data and callbacks cross the UI boundary through props rather than leaf-level API access or application context.
- **States are part of the contract.** Pending, empty, failed, success, and domain-specific states are designed up front and handled exhaustively.
- **One contract for every consumer.** The application, Storybook, and tests render the same declared UI instead of maintaining separate representations.
- **Machine-verifiable architecture.** Types and lint rules communicate boundaries to both humans and AI agents.
- **Composition over framework machinery.** Branded UI preserves normal component composition and adds the smallest runtime layer needed to carry the contract.
- **Framework-neutral roles.** The core model stays independent from framework-specific adapters and tooling.

## Packages

| Package | Purpose | Documentation |
| --- | --- | --- |
| [`@jayjnu/branded-ui`](packages/core) | Framework-neutral role contracts | Source package |
| [`@jayjnu/branded-ui-react`](packages/react) | React factories, Bindings, exhaustive state matching, and Suspense composition | [React guide](packages/react/README.md) |
| [`@jayjnu/oxlint-plugin-branded-ui-react`](packages/oxlint-plugin-branded-ui-react) | Optional architecture rules for React projects | [Plugin guide](packages/oxlint-plugin-branded-ui-react/README.md) |

## Example

[`examples/react-vite-oxlint`](examples/react-vite-oxlint) demonstrates nested Bindings, TanStack Query, Suspense, Error Boundaries, and Oxlint integration.

## Status

Branded UI is experimental and its API may change before `1.0`.

## License

[MIT](LICENSE)
