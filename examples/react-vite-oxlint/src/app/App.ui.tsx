import type { ReactNode } from "react";
import { layoutUI, syncUI } from "@jayjnu/branded-ui-react";
import { ButtonUI } from "../shared/ui/Button.ui";

const AppLayout = layoutUI({
  component: (props: { header: ReactNode; content: ReactNode }) => (
    <>
      <header>{props.header}</header>
      <main>{props.content}</main>
    </>
  ),
  slots: ["header", "content"],
});

export const AppUI = syncUI({
  layout: AppLayout,
  slots: {
    header: {
      Brand: () => <strong>Acme Admin</strong>,
      Navigation: (props: { dashboard: ReactNode; orders: ReactNode; account: ReactNode }) => (
        <nav aria-label="Primary">
          <ul>
            <li>{props.dashboard}</li>
            <li>{props.orders}</li>
            <li>{props.account}</li>
          </ul>
        </nav>
      ),
    },
    content: {
      Router: (props: { children: ReactNode }) => <>{props.children}</>,
      Error: (props: { onRetry: () => void }) => (
        <section role="alert">
          <p>Could not load this page.</p>
          <ButtonUI onClick={props.onRetry}>Retry</ButtonUI>
        </section>
      ),
    },
  },
});
