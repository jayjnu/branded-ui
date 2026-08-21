import type { ReactNode } from "react";
import { syncUI } from "@jayjnu/branded-ui-react";
import { PageLayout } from "../../shared/ui/Page.ui";

export const OrdersPageUI = syncUI({
  layout: PageLayout,
  slots: {
    title: { Heading: () => <h1>Orders</h1> },
    content: {
      Feature: (props: { children: ReactNode }) => <>{props.children}</>,
    },
  },
});
