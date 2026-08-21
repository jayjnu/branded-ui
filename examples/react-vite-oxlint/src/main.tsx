import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DashboardPage } from "./dashboard/Dashboard.binding";

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <DashboardPage />
  </StrictMode>,
);
