import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { binding } from "@jayjnu/branded-ui-react";
import { BrowserRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { AccountPage } from "../pages/account/AccountPage.binding";
import { DashboardPage } from "../pages/dashboard/DashboardPage.binding";
import { NotFoundPage } from "../pages/not-found/NotFoundPage.binding";
import { OrdersPage } from "../pages/orders/OrdersPage.binding";
import { AppUI } from "./App.ui";

export const App = binding(AppUI)(({ Layout, Slots }) => {
  function RoutedApp() {
    const location = useLocation();

    return (
      <Layout
        header={
          <>
            <Slots.header.Brand />
            <Slots.header.Navigation
              dashboard={
                <NavLink to="/" end>
                  Dashboard
                </NavLink>
              }
              orders={<NavLink to="/orders">Orders</NavLink>}
              account={<NavLink to="/account">Account</NavLink>}
            />
          </>
        }
        content={
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                resetKeys={[location.pathname]}
                fallbackRender={({ resetErrorBoundary }) => (
                  <Slots.content.Error onRetry={resetErrorBoundary} />
                )}
              >
                <Slots.content.Router>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Slots.content.Router>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        }
      />
    );
  }

  return function AppBinding() {
    return (
      <BrowserRouter>
        <RoutedApp />
      </BrowserRouter>
    );
  };
});
