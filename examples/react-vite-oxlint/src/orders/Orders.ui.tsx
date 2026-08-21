import type { ReactNode } from "react";
import { asyncUI, layoutUI } from "@jayjnu/branded-ui-react";

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

const OrdersFallbackLayout = layoutUI({
  component: (props: { content: ReactNode; action: ReactNode }) => (
    <section role="alert">
      <div>{props.content}</div>
      <footer>{props.action}</footer>
    </section>
  ),
  slots: ["content", "action"],
});

const Header = () => <h2 id="orders-title">Orders</h2>;

export const OrdersUI = asyncUI({
  layout: OrdersLayout,
  states: asyncUI.states({
    success: {
      header: {
        Title: Header,
      },
      content: {
        List: (props: { orders: readonly Order[] }) => (
          <ul>
            {props.orders.map((order) => (
              <li key={order.id}>{order.name}</li>
            ))}
          </ul>
        ),
      },
      footer: {
        Actions: (props: {
          onClear: () => void;
          onPending: () => void;
          onFailed: () => void;
          onFallback: () => void;
        }) => (
          <>
            <button type="button" onClick={props.onClear}>
              Clear orders
            </button>
            <button type="button" onClick={props.onPending}>
              Show pending
            </button>
            <button type="button" onClick={props.onFailed}>
              Show failure
            </button>
            <button type="button" onClick={props.onFallback}>
              Show fallback
            </button>
          </>
        ),
      },
    },
    empty: {
      header: {
        Title: Header,
      },
      content: {
        Message: () => <p>No orders yet.</p>,
      },
      footer: {
        Action: (props: { onReset: () => void }) => (
          <button type="button" onClick={props.onReset}>
            Reset orders
          </button>
        ),
      },
    },
    pending: {
      header: {
        Title: Header,
      },
      content: {
        Skeleton: () => <p>Loading orders…</p>,
      },
      footer: {
        Cancel: (props: { onCancel: () => void }) => (
          <button type="button" onClick={props.onCancel}>
            Cancel
          </button>
        ),
      },
    },
    failed: {
      header: {
        Title: Header,
      },
      content: {
        Message: (props: { message: string }) => (
          <p role="alert">{props.message}</p>
        ),
      },
      footer: {
        Retry: (props: { onRetry: () => void }) => (
          <button type="button" onClick={props.onRetry}>
            Retry
          </button>
        ),
      },
    },
  }),
  fallback: {
    layout: OrdersFallbackLayout,
    slots: {
      content: {
        Message: () => <p>An unexpected application state occurred.</p>,
      },
      action: {
        Reset: (props: { onReset: () => void }) => (
          <button type="button" onClick={props.onReset}>
            Reset application
          </button>
        ),
      },
    },
  },
});
