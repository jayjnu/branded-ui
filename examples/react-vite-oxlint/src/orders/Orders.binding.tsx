import { useState } from "react";
import { binding } from "@jayjnu/branded-ui-react";
import { OrdersUI, type Order } from "./Orders.ui";

const initialOrders: readonly Order[] = [
  { id: "1", name: "Starter plan" },
  { id: "2", name: "Team plan" },
];

export const OrdersPanel = binding(OrdersUI)(({ Layout, States, Fallback }) => {
  function OrdersBinding() {
    const [orders, setOrders] = useState(initialOrders);
    const [status, setStatus] = useState<
      "ready" | "pending" | "failed" | "fallback"
    >("ready");

    if (status === "pending") {
      return (
        <Layout
          header={<States.pending.header.Title />}
          content={<States.pending.content.Skeleton />}
          footer={
            <States.pending.footer.Cancel
              onCancel={() => setStatus("ready")}
            />
          }
        />
      );
    }

    if (status === "failed") {
      return (
        <Layout
          header={<States.failed.header.Title />}
          content={
            <States.failed.content.Message message="Could not load orders." />
          }
          footer={
            <States.failed.footer.Retry onRetry={() => setStatus("ready")} />
          }
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
          header={<States.empty.header.Title />}
          content={<States.empty.content.Message />}
          footer={
            <States.empty.footer.Action
              onReset={() => setOrders(initialOrders)}
            />
          }
        />
      );
    }

    return (
      <Layout
        header={<States.success.header.Title />}
        content={<States.success.content.List orders={orders} />}
        footer={
          <States.success.footer.Actions
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
