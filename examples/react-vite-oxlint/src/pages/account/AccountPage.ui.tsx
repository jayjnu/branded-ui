import type { ReactNode } from "react";
import { syncUI } from "@jayjnu/branded-ui-react";
import { PageLayout } from "../../shared/ui/Page.ui";

export const AccountPageUI = syncUI({
  layout: PageLayout,
  slots: {
    title: { Heading: () => <h1>Account</h1> },
    content: {
      Feature: (props: { children: ReactNode }) => <>{props.children}</>,
    },
  },
});
