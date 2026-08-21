import { binding } from "@jayjnu/branded-ui-react";
import { OrdersPanel } from "../../features/orders/Orders.binding";
import { OrdersPageUI } from "./OrdersPage.ui";

export const OrdersPage = binding(OrdersPageUI)(({ Layout, Slots }) => {
  return function OrdersPageBinding() {
    return (
      <Layout
        title={<Slots.title.Heading />}
        content={
          <Slots.content.Feature>
            <OrdersPanel />
          </Slots.content.Feature>
        }
      />
    );
  };
});
