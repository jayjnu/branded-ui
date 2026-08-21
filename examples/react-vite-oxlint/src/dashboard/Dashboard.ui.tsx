import type { ReactNode } from "react";
import { layoutUI, syncUI } from "@jayjnu/branded-ui-react";

const DashboardLayout = layoutUI({
  component: (props: { header: ReactNode; content: ReactNode }) => (
    <main>
      <header>{props.header}</header>
      <div>{props.content}</div>
    </main>
  ),
  slots: ["header", "content"],
});

export const DashboardUI = syncUI({
  layout: DashboardLayout,
  slots: {
    header: {
      Title: () => <h1>Dashboard</h1>,
    },
    content: {
      Grid: (props: { orders: ReactNode; account: ReactNode }) => (
        <div>
          {props.orders}
          {props.account}
        </div>
      ),
    },
  },
});
