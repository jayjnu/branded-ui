import { binding } from "@jayjnu/branded-ui-react";
import { AccountPanel } from "../account/Account.binding";
import { OrdersPanel } from "../orders/Orders.binding";
import { DashboardUI } from "./Dashboard.ui";

export const DashboardPage = binding(DashboardUI)(({ Layout, Slots }) => {
  function DashboardBinding() {
    return (
      <Layout
        header={<Slots.header.Title />}
        content={
          <Slots.content.Grid
            orders={<OrdersPanel />}
            account={<AccountPanel />}
          />
        }
      />
    );
  }

  return DashboardBinding;
});
