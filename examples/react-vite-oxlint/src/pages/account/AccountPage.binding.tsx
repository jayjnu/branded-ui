import { binding } from "@jayjnu/branded-ui-react";
import { AccountPanel } from "../../features/account/Account.binding";
import { AccountPageUI } from "./AccountPage.ui";

export const AccountPage = binding(AccountPageUI)(({ Layout, Slots }) => {
  return function AccountPageBinding() {
    return (
      <Layout
        title={<Slots.title.Heading />}
        content={
          <Slots.content.Feature>
            <AccountPanel />
          </Slots.content.Feature>
        }
      />
    );
  };
});
