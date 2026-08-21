import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { asyncUI, binding, suspense } from "@jayjnu/branded-ui-react";
import { OrdersUI, type Order } from "./Orders.ui";

const orders: readonly Order[] = [
  { id: "1", name: "Starter plan" },
  { id: "2", name: "Team plan" },
];

type QueryScenario = "success" | "empty" | "failed";

async function fetchOrders(scenario: QueryScenario) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (scenario === "failed") throw new Error("Could not load orders.");
  return scenario === "empty" ? [] : orders;
}

export const OrdersPanel = binding(OrdersUI)(({ Layout, States, Fallback }) =>
  suspense(Fallback, (Pending) => (
    <Pending.Layout header={<Pending.header.Title />} content={<Pending.content.Skeleton />} />
  ))(function OrdersContent() {
    const [scenario, setScenario] = useState<QueryScenario>("success");
    const query = useSuspenseQuery({
      queryKey: ["orders", scenario],
      queryFn: () => fetchOrders(scenario),
      retry: false,
    });
    const state = query.data.length === 0 ? "empty" : query.isFetching ? "refreshing" : "success";

    return asyncUI.exhaustive(state, States, {
      success: (Success) => (
        <Layout
          header={<Success.header.Title />}
          content={<Success.content.List orders={query.data} />}
          footer={
            <Success.footer.Actions
              onRefresh={() => void query.refetch()}
              onEmpty={() => setScenario("empty")}
              onFailed={() => setScenario("failed")}
            />
          }
        />
      ),
      empty: (Empty) => (
        <Layout
          header={<Empty.header.Title />}
          content={<Empty.content.Message />}
          footer={<Empty.footer.Action onLoad={() => setScenario("success")} />}
        />
      ),
      refreshing: (Refreshing) => (
        <Layout
          header={<Refreshing.header.Title />}
          content={<Refreshing.content.List orders={query.data} />}
          footer={<Refreshing.footer.Status />}
        />
      ),
    });
  }),
);
