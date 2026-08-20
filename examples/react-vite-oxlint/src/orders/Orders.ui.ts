import { asyncUI } from "@jayjnu/branded-ui-react";
import { OrdersLayout } from "./Orders.layout";
import { OrdersError, OrdersSkeleton, OrdersView } from "./Orders.view";

export const OrdersUI = asyncUI({
  layout: OrdersLayout,
  component: OrdersView,
  skeleton: OrdersSkeleton,
  error: OrdersError,
});
