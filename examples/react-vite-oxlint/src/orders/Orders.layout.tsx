import type { ReactNode } from "react";
import { layoutUI } from "@jayjnu/branded-ui-react";

export const OrdersLayout = layoutUI((props: { children?: ReactNode }) => (
  <main>
    <h1>Orders</h1>
    {props.children}
  </main>
));
