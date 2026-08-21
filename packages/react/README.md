# @jayjnu/branded-ui-react

[English](README.md) | [한국어](README.ko.md)

React factories for declaring Branded UI contracts and connecting them to application behavior.

## Install

```sh
pnpm add @jayjnu/branded-ui-react
```

React 18 or newer is required as a peer dependency.

## Mental model

A Branded UI feature is split into two parts:

- a **UI declaration** defines the layout, slots, components, and visible states;
- a **Binding** owns hooks, data access, effects, and state transitions, then composes only the declared UI.

This keeps presentation contracts independently readable while TypeScript verifies slot names, component props, state coverage, and Binding identity.

## API

| Factory | Role |
| --- | --- |
| `pureUI(component)` | Brands a standalone presentation component. |
| `layoutUI({ component, slots })` | Declares which component props are composition slots. |
| `syncUI({ layout, slots })` | Declares a UI with one synchronous set of slot components. |
| `asyncUI({ layout, states, fallback? })` | Declares state-specific slot components and an optional Suspense fallback. |
| `asyncUI.states(states)` | Requires `success`, `empty`, `pending`, and `failed` while preserving custom states. |
| `asyncUI.exhaustive(state, states, cases)` | Matches every declared state and rejects missing or extra cases. |
| `binding(ui)(definition)` | Injects a contract's layout and components into a behavior-owning component. |
| `suspense(fallback, renderFallback)(content)` | Composes React Suspense while preserving async state coverage in the Binding type. |

## Synchronous UI

Declare presentation separately from behavior:

```tsx
// Counter.ui.tsx
import type { ReactNode } from "react";
import { layoutUI, syncUI } from "@jayjnu/branded-ui-react";

const CounterLayout = layoutUI({
  component: (props: { content: ReactNode; actions: ReactNode }) => (
    <section>
      <div>{props.content}</div>
      <footer>{props.actions}</footer>
    </section>
  ),
  slots: ["content", "actions"],
});

export const CounterUI = syncUI({
  layout: CounterLayout,
  slots: {
    content: { Value: (props: { value: number }) => <output>{props.value}</output> },
    actions: { Increment: (props: { onClick: () => void }) => <button onClick={props.onClick}>Increment</button> },
  },
});
```

The Binding owns React state and receives only the declared composition surface:

```tsx
// Counter.binding.tsx
import { useState } from "react";
import { binding } from "@jayjnu/branded-ui-react";
import { CounterUI } from "./Counter.ui";

export const Counter = binding(CounterUI)(({ Layout, Slots }) => {
  return function CounterBinding() {
    const [value, setValue] = useState(0);

    return (
      <Layout
        content={<Slots.content.Value value={value} />}
        actions={<Slots.actions.Increment onClick={() => setValue(value + 1)} />}
      />
    );
  };
});
```

Layout slots may be optional. A required layout prop must be declared in every sync slot set and every async state; an optional prop may be omitted.

## Async UI: explicit result states

Use `asyncUI.states()` when the Binding owns the standard pending and failed states:

```tsx
const OrdersUI = asyncUI({
  layout,
  states: asyncUI.states({
    success,
    empty,
    pending,
    failed,
    refreshing,
  }),
});

export const Orders = binding(OrdersUI)(({ Layout, States }) => {
  return function OrdersBinding() {
    const query = useQuery(/* ... */);
    const state = mapQueryToState(query);

    return asyncUI.exhaustive(state, States, {
      success: (Success) => renderSuccess(Layout, Success, query.data),
      empty: (Empty) => renderEmpty(Layout, Empty),
      pending: (Pending) => renderPending(Layout, Pending),
      failed: (Failed) => renderFailed(Layout, Failed, query.error),
      refreshing: (Refreshing) => renderRefreshing(Layout, Refreshing, query.data),
    });
  };
});
```

`asyncUI.exhaustive()` ties the case map to the declared state map, so adding or removing a state produces a type error at the Binding until its handling is updated.

## Async UI: Suspense

When data access suspends, declare presentation for the fallback separately from resolved application states:

```tsx
const OrdersUI = asyncUI({
  layout,
  states: {
    success,
    empty,
    refreshing,
  },
  fallback: {
    layout: pendingLayout,
    slots: pendingSlots,
  },
});

export const Orders = binding(OrdersUI)(
  ({ Layout, States, Fallback }) =>
    suspense(Fallback, (Pending) => (
      <Pending.Layout content={<Pending.content.Skeleton />} />
    ))(function OrdersContent() {
      const query = useSuspenseQuery(/* ... */);
      const state = mapResolvedQueryToState(query);

      return asyncUI.exhaustive(state, States, {
        success: (Success) => renderSuccess(Layout, Success, query.data),
        empty: (Empty) => renderEmpty(Layout, Empty),
        refreshing: (Refreshing) => renderRefreshing(Layout, Refreshing, query.data),
      });
    }),
);
```

The fallback is a presentation contract, not a synthetic application state. Query errors remain the responsibility of an ancestor Error Boundary, including query-specific reset behavior.

## Composition rules

- Components passed to a Branded UI factory must be unbranded; a `PureUI` or `Binding` cannot be silently re-declared in another role.
- Component keys inside slots must begin with an uppercase letter.
- Bindings may compose other Bindings as application-level children, but UI declaration modules should not import Binding modules.
- `asyncUI.exhaustive()` rejects both missing and extra state cases.
- Exhaustive async Bindings are designed for function components. Ref-forwarding async Bindings do not currently have a dedicated adapter.

These rules are primarily enforced by TypeScript. File-local architecture checks such as Binding imports and direct slot placement are available through [`@jayjnu/oxlint-plugin-branded-ui-react`](https://github.com/jayjnu/branded-ui/tree/main/packages/oxlint-plugin-branded-ui-react).

## Example

See [`examples/react-vite-oxlint`](https://github.com/jayjnu/branded-ui/tree/main/examples/react-vite-oxlint) for nested Bindings, TanStack Query, Suspense, Error Boundaries, and Oxlint integration.

## License

[MIT](https://github.com/jayjnu/branded-ui/blob/main/LICENSE)
