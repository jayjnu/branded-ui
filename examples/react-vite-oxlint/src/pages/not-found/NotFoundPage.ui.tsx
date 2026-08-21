import { syncUI } from "@jayjnu/branded-ui-react";
import { PageLayout } from "../../shared/ui/Page.ui";

export const NotFoundPageUI = syncUI({
  layout: PageLayout,
  slots: {
    title: { Heading: () => <h1>Page not found</h1> },
    content: { Message: () => <p>Check the address and try again.</p> },
  },
});
