import type { ReactNode } from "react";
import { asyncUI, layoutUI } from "@jayjnu/branded-ui-react";
import type { Order } from "./Orders.data";

const OrdersLayout = layoutUI({
  component: (props: { title: ReactNode; content: ReactNode }) => (
    <section aria-labelledby="orders-heading">
      {props.title}
      {props.content}
    </section>
  ),
  slots: ["title", "content"],
});

const Title = () => <h2 id="orders-heading">Recent orders</h2>;

export const OrdersUI = asyncUI({
  layout: OrdersLayout,
  states: {
    success: {
      title: { Title },
      content: {
        List: ({ orders }: { orders: readonly Order[] }) => (
          <ul>
            {orders.map((order) => (
              <li key={order.id}>
                {order.id} · {order.customer} · ${order.total}
              </li>
            ))}
          </ul>
        ),
      },
    },
    empty: {
      title: { Title },
      content: { Message: () => <p>No orders found.</p> },
    },
    failed: {
      title: { Title },
      content: {
        Message: () => (
          <p role="alert">
            Could not load orders. <a href="/?scenario=success">Retry</a>
          </p>
        ),
      },
    },
  },
  fallback: {
    layout: OrdersLayout,
    slots: {
      title: { Title },
      content: { Skeleton: () => <p role="status">Loading orders…</p> },
    },
  },
});
