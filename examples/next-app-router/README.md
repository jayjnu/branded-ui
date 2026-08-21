# Next.js App Router example

A small order page showing how Branded UI models server-side data loading in the Next.js App Router.

```text
app/
├── layout.tsx
└── page.tsx                         # search params and scenario links
src/features/orders/
├── Orders.data.ts                  # async server-side data query
├── Orders.ui.tsx                   # success, empty, pending, and failed UI states
└── Orders.binding.tsx              # async Server Binding and suspense helper
```

`OrdersPanel` loads data in an async Server Component. Its `suspense()` helper streams the contract's fallback while the query runs, then the Binding exhaustively renders the resolved `success`, `empty`, or `failed` state.

Use the links on the page to run each scenario:

- `/?scenario=success`: returns order data.
- `/?scenario=empty`: returns an empty result.
- `/?scenario=failed`: simulates a failed query and offers a retry link.

The in-memory query stands in for a database or remote API client, keeping the example runnable without external services.

## Run

```sh
pnpm dev
pnpm typecheck
pnpm build
```
