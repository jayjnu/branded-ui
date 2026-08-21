# React + Vite+ + Oxlint SPA example

A small admin SPA showing where Branded UI contracts live in a typical React project.

```text
src/
├── app/                         # providers, shell, and router composition
│   ├── App.ui.tsx
│   └── App.binding.tsx
├── shared/ui/                   # reusable, app-agnostic UI
│   ├── Button.ui.tsx
│   └── Page.ui.tsx
├── features/                    # feature UI contracts and application logic
│   ├── account/
│   │   ├── Account.ui.tsx
│   │   └── Account.binding.tsx
│   └── orders/
│       ├── Orders.ui.tsx
│       └── Orders.binding.tsx
└── pages/                       # route-level composition
    ├── dashboard/
    ├── orders/
    ├── account/
    └── not-found/
```

The dependency direction is `app → pages → features → shared`. UI files declare layouts, slots, and visible states. Binding files own hooks, queries, state transitions, router integration, and composition of other Bindings.

## Scenarios

### `/` Dashboard

The dashboard composes `OrdersPanel` and `AccountPanel` on one page. On the first visit, the orders panel shows its Suspense fallback and then a list, while the account panel starts with Ada Lovelace's account. This route shows how a page Binding composes two independently stateful feature Bindings.

### `/orders` Orders

The dedicated orders page exposes these query states:

- First visit: `Loading orders…` followed by the order list.
- `Refresh orders`: keeps the current list visible and shows `Refreshing orders…` until the request finishes.
- `Load empty result`: shows the Suspense fallback, then `No orders yet.`
- `Load orders`: returns from the empty state to the populated list.
- `Load query error`: shows the Suspense fallback, then the app-level error screen. `Retry` runs the query again. Navigating to another route resets the route error boundary.

### `/account` Account

The account page keeps its state locally so each transition can be triggered without an API:

- `Refresh`: changes to the refreshing state. `Cancel refresh` returns to the account summary.
- `Simulate failure`: shows the feature-level error state. `Retry` returns to the account summary.
- `Sign out`: shows the empty state. `Restore account` restores the initial account.

### Unknown route

Open a path such as `/missing` to see the `NotFoundPage` route.

The shared `ButtonUI` is used by both features and the app error screen. Every route-level UI contract reuses `PageLayout`. `OrdersPanel` uses TanStack Query with Suspense, and `asyncUI.exhaustive()` covers its resolved `success`, `empty`, and `refreshing` states.

## Run

```sh
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
```

Oxlint checks direct slot placement, UI-to-Binding imports, and raw component exports through `@jayjnu/oxlint-plugin-branded-ui-react`.
