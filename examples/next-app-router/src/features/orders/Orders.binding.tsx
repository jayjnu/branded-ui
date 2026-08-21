import { asyncUI, binding, suspense } from "@jayjnu/branded-ui-react";
import { getOrders, type OrdersScenario } from "./Orders.data";
import { OrdersUI } from "./Orders.ui";

export const OrdersPanel = binding(OrdersUI)(({ Layout, States, Fallback }) =>
  suspense(Fallback, (Pending) => (
    <Pending.Layout
      title={<Pending.title.Title />}
      content={<Pending.content.Skeleton />}
    />
  ))(async function OrdersContent({ scenario }: { scenario: OrdersScenario }) {
    const orders = await getOrders(scenario).catch(() => null);
    const state = orders === null ? "failed" : orders.length === 0 ? "empty" : "success";

    return asyncUI.exhaustive(state, States, {
      success: (Success) => (
        <Layout
          title={<Success.title.Title />}
          content={<Success.content.List orders={orders ?? []} />}
        />
      ),
      empty: (Empty) => (
        <Layout title={<Empty.title.Title />} content={<Empty.content.Message />} />
      ),
      failed: (Failed) => (
        <Layout title={<Failed.title.Title />} content={<Failed.content.Message />} />
      ),
    });
  }),
);
