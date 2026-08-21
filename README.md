# branded-ui

Define and enforce UI component roles with framework-agnostic, compile-time brands.

## Packages

- `@jayjnu/branded-ui`: framework-neutral contracts
- `@jayjnu/branded-ui-react`: React declarations, Binding, exhaustive state matching, and Suspense composition

## Async Binding modes

### Explicit result mode

Use `binding()` with `useQuery()` when the Binding owns pending and failed states.

```tsx
const OrdersUI = asyncUI({
  layout,
  states: asyncUI.states({
    success,
    empty,
    pending,
    failed,
  }),
});

export const Orders = binding(OrdersUI)(({ Layout, States }) => {
  return function OrdersBinding() {
    const query = useQuery(/* ... */);
    const state = /* map query result to a state */;

    return asyncUI.exhaustive(state, States, {
      success: (Success) => /* ... */,
      empty: (Empty) => /* ... */,
      pending: (Pending) => /* ... */,
      failed: (Failed) => /* ... */,
    });
  };
});
```

`asyncUI.states()` requires the four standard states and preserves additional custom states.

### Suspense mode

Use the proof-preserving `suspense()` HOC with `useSuspenseQuery()`. The Async Binding only returns resolved states; its fallback contract supplies the Suspense presentation.

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
      const state = /* empty, refreshing, or success */;

      return asyncUI.exhaustive(state, States, {
        success: (Success) => /* ... */,
        empty: (Empty) => /* ... */,
        refreshing: (Refreshing) => /* ... */,
      });
    }),
);
```

Query errors are handled by an ancestor Error Boundary. Query-specific reset behavior remains application composition rather than a Branded UI contract.

## Oxlint plugin

`@jayjnu/branded-ui-oxlint` provides fast, file-local architecture checks.

```json
{
  "jsPlugins": ["@jayjnu/branded-ui-oxlint"],
  "rules": {
    "branded-ui/correct-slot": "error",
    "branded-ui/no-binding-import-in-ui": "error",
    "branded-ui/no-raw-component-export": "error"
  }
}
```

The initial rules catch directly referenced components in the wrong Layout slot, `.binding` imports from UI declaration modules, and unbranded PascalCase component exports. Cross-file semantic analysis is intentionally deferred.

## Examples

Example projects follow `examples/$stack-$build-tool-$linter`. See `examples/react-vite-oxlint` for nested Bindings, TanStack Query, Suspense, and Error Boundary composition.
