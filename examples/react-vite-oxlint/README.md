# React + Vite+ + Oxlint example

The page Binding composes independently stateful intermediate Bindings:

```text
DashboardPage (Binding → DashboardUI)
├── OrdersPanel (Binding → OrdersUI)
└── AccountPanel (Binding → AccountUI)
```

Each panel owns its data-state mapping while the page Binding only owns page composition.
