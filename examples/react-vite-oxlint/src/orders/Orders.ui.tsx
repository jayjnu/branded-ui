import type { ReactNode } from "react";
import { asyncUI, layoutUI, pureUI } from "@jayjnu/branded-ui-react";

export type Order = {
  id: string;
  name: string;
};

type OrdersLayoutProps = {
  header: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
};

const OrdersLayoutComponent = (props: OrdersLayoutProps) => (
  <section aria-labelledby="orders-title">
    <header>{props.header}</header>
    <div>{props.content}</div>
    {props.footer && <footer>{props.footer}</footer>}
  </section>
);

const OrdersLayout = layoutUI({
  component: OrdersLayoutComponent,
  slots: ["header", "content", "footer"],
});

const Header = () => <h2 id="orders-title">Orders</h2>;
const OrdersList = (props: { orders: readonly Order[] }) => (
  <ul>
    {props.orders.map((order) => (
      <li key={order.id}>{order.name}</li>
    ))}
  </ul>
);

export const OrdersUI = asyncUI({
  layout: OrdersLayout,
  states: {
    success: {
      header: { Title: Header },
      content: { List: OrdersList },
      footer: {
        Actions: (props: {
          onRefresh: () => void;
          onEmpty: () => void;
          onFailed: () => void;
        }) => (
          <>
            <button type="button" onClick={props.onRefresh}>
              Refresh orders
            </button>
            <button type="button" onClick={props.onEmpty}>
              Load empty result
            </button>
            <button type="button" onClick={props.onFailed}>
              Load query error
            </button>
          </>
        ),
      },
    },
    empty: {
      header: { Title: Header },
      content: { Message: () => <p>No orders yet.</p> },
      footer: {
        Action: (props: { onLoad: () => void }) => (
          <button type="button" onClick={props.onLoad}>
            Load orders
          </button>
        ),
      },
    },
    refreshing: {
      header: { Title: Header },
      content: { List: OrdersList },
      footer: { Status: () => <output>Refreshing orders…</output> },
    },
  },
  fallback: {
    layout: OrdersLayout,
    slots: {
      header: { Title: Header },
      content: { Skeleton: () => <p>Loading orders…</p> },
    },
  },
});

export const OrdersError = pureUI((props: { onRetry: () => void }) => (
  <section role="alert">
    <p>Could not load orders.</p>
    <button type="button" onClick={props.onRetry}>
      Retry
    </button>
  </section>
));
