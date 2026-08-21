import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { binding } from "@jayjnu/branded-ui-react";
import { AccountPanel } from "../account/Account.binding";
import { OrdersPanel } from "../orders/Orders.binding";
import { OrdersError } from "../orders/Orders.ui";
import { DashboardUI } from "./Dashboard.ui";

export const DashboardPage = binding(DashboardUI)(({ Layout, Slots }) => {
  function DashboardBinding() {
    return (
      <Layout
        header={<Slots.header.Title />}
        content={
          <Slots.content.Grid
            orders={
              <QueryErrorResetBoundary>
                {({ reset }) => (
                  <ErrorBoundary
                    onReset={reset}
                    fallbackRender={({ resetErrorBoundary }) => (
                      <OrdersError onRetry={resetErrorBoundary} />
                    )}
                  >
                    <OrdersPanel />
                  </ErrorBoundary>
                )}
              </QueryErrorResetBoundary>
            }
            account={<AccountPanel />}
          />
        }
      />
    );
  }

  return DashboardBinding;
});
