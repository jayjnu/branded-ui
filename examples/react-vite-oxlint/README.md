# React + Vite+ + Oxlint example

The page Binding composes independently stateful intermediate Bindings:

```text
DashboardPage (Binding → SyncUISet)
├── OrdersPanel (Binding → OrdersUI)
└── AccountPanel (Binding → AccountUI)
```

Each panel owns its async data-state mapping while the page Binding consumes a SyncUISet and only owns page composition.
