import type { ReactNode } from "react";
import { syncUI } from "@jayjnu/branded-ui-react";
import { PageLayout } from "../../shared/ui/Page.ui";

export const DashboardPageUI = syncUI({
  layout: PageLayout,
  slots: {
    title: { Heading: () => <h1>Dashboard</h1> },
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
