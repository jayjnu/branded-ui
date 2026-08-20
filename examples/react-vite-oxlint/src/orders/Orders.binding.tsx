import { useState } from "react";
import { binding } from "@jayjnu/branded-ui-react";
import { OrdersLayout } from "./Orders.layout";
import { OrdersUI } from "./Orders.ui";
import { OrdersView, type Order } from "./Orders.view";

const initialOrders: readonly Order[] = [
  { id: "1", name: "Starter plan" },
  { id: "2", name: "Team plan" },
];

const OrdersBinding = () => {
  const [orders, setOrders] = useState(initialOrders);

  return (
    <OrdersLayout>
      <OrdersView orders={orders} />
      <button type="button" onClick={() => setOrders([])}>
        Clear orders
      </button>
    </OrdersLayout>
  );
};

export const OrdersPage = binding({
  ui: OrdersUI,
  component: OrdersBinding,
});
