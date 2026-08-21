import { binding } from "@jayjnu/branded-ui-react";
import { AccountPanel } from "../../features/account/Account.binding";
import { OrdersPanel } from "../../features/orders/Orders.binding";
import { DashboardPageUI } from "./DashboardPage.ui";

export const DashboardPage = binding(DashboardPageUI)(({ Layout, Slots }) => {
  return function DashboardPageBinding() {
    return (
      <Layout
        title={<Slots.title.Heading />}
        content={<Slots.content.Grid orders={<OrdersPanel />} account={<AccountPanel />} />}
      />
    );
  };
});
