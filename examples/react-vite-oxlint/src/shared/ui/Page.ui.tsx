import type { ReactNode } from "react";
import { layoutUI } from "@jayjnu/branded-ui-react";

export const PageLayout = layoutUI({
  component: (props: { title: ReactNode; content: ReactNode }) => (
    <section>
      <header>{props.title}</header>
      <div>{props.content}</div>
    </section>
  ),
  slots: ["title", "content"],
});
