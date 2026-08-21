import type { ReactNode } from "react";
import { asyncUI, layoutUI } from "@jayjnu/branded-ui-react";

const DashboardLayout = layoutUI({
  component: (props: { header: ReactNode; content: ReactNode }) => (
    <main>
      <header>{props.header}</header>
      <div>{props.content}</div>
    </main>
  ),
  slots: ["header", "content"],
});

const Title = () => <h1>Dashboard</h1>;

export const DashboardUI = asyncUI({
  layout: DashboardLayout,
  states: {
    success: {
      header: { Title },
      content: {
        Grid: (props: { orders: ReactNode; account: ReactNode }) => (
          <div>
            {props.orders}
            {props.account}
          </div>
        ),
      },
    },
    empty: {
      header: { Title },
      content: { Message: () => <p>No dashboard sections are available.</p> },
    },
    pending: {
      header: { Title },
      content: { Skeleton: () => <p>Loading dashboard…</p> },
    },
    failed: {
      header: { Title },
      content: {
        Message: () => <p role="alert">Could not load the dashboard.</p>,
      },
    },
  },
});
