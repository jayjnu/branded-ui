import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OrdersPage } from "./orders/Orders.binding";

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <OrdersPage />
  </StrictMode>,
);
