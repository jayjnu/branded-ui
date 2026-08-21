# React + Vite+ + Oxlint example

The page Binding composes independently stateful intermediate Bindings:

```text
DashboardPage (Binding → SyncUISet)
├── QueryErrorResetBoundary + ErrorBoundary
│   └── OrdersPanel (Binding → Suspense HOC → OrdersUI)
└── AccountPanel (Binding → AccountUI + local React state)
```

`OrdersPanel` uses `useSuspenseQuery`. Its Binding declaration wraps the query content with the proof-preserving `suspense()` HOC:

```text
initial/key-change pending → AsyncUISet fallback → React Suspense
query error                → parent ErrorBoundary
empty data                 → empty
isFetching with data       → refreshing
resolved data              → success
```

The fallback contract defines Suspense presentation without creating a synthetic application state. `AccountPanel` keeps explicit local states to demonstrate that AsyncUI supports both boundary-driven and result-driven flows.
