import { binding } from "@jayjnu/branded-ui-react";
import { NotFoundPageUI } from "./NotFoundPage.ui";

export const NotFoundPage = binding(NotFoundPageUI)(({ Layout, Slots }) => {
  return function NotFoundPageBinding() {
    return <Layout title={<Slots.title.Heading />} content={<Slots.content.Message />} />;
  };
});
