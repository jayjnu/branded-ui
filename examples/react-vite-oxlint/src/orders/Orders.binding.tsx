import { useState } from "react";
import { binding } from "@jayjnu/branded-ui-react";
import { OrdersUI, type Order } from "./Orders.ui";

const initialOrders: readonly Order[] = [
  { id: "1", name: "Starter plan" },
  { id: "2", name: "Team plan" },
];

export const OrdersPage = binding(OrdersUI)((
  { Layout, Success, Empty, Pending, Failed, Fallback },
) => {
  function OrdersBinding() {
    const [orders, setOrders] = useState(initialOrders);
    const [status, setStatus] = useState<
      "ready" | "pending" | "failed" | "fallback"
    >("ready");

    if (status === "pending") {
      return (
        <Layout
          header={<Pending.header.Title />}
          content={<Pending.content.Skeleton />}
          footer={
            <Pending.footer.Cancel onCancel={() => setStatus("ready")} />
          }
        />
      );
    }

    if (status === "failed") {
      return (
        <Layout
          header={<Failed.header.Title />}
          content={
            <Failed.content.Message message="Could not load orders." />
          }
          footer={<Failed.footer.Retry onRetry={() => setStatus("ready")} />}
        />
      );
    }

    if (status === "fallback") {
      return (
        <Fallback.Layout
          content={<Fallback.content.Message />}
          action={<Fallback.action.Reset onReset={() => setStatus("ready")} />}
        />
      );
    }

    if (orders.length === 0) {
      return (
        <Layout
          header={<Empty.header.Title />}
          content={<Empty.content.Message />}
          footer={
            <Empty.footer.Action onReset={() => setOrders(initialOrders)} />
          }
        />
      );
    }

    return (
      <Layout
        header={<Success.header.Title />}
        content={<Success.content.List orders={orders} />}
        footer={
          <Success.footer.Actions
            onClear={() => setOrders([])}
            onPending={() => setStatus("pending")}
            onFailed={() => setStatus("failed")}
            onFallback={() => setStatus("fallback")}
          />
        }
      />
    );
  }

  return OrdersBinding;
});
