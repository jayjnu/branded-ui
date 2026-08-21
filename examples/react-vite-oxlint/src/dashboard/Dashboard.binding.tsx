import { binding } from "@jayjnu/branded-ui-react";
import { AccountPanel } from "../account/Account.binding";
import { OrdersPanel } from "../orders/Orders.binding";
import { DashboardUI } from "./Dashboard.ui";

export const DashboardPage = binding(DashboardUI)(({ Layout, Success }) => {
  function DashboardBinding() {
    return (
      <Layout
        header={<Success.header.Title />}
        content={
          <Success.content.Grid
            orders={<OrdersPanel />}
            account={<AccountPanel />}
          />
        }
      />
    );
  }

  return DashboardBinding;
});
