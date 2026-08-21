import { useState } from "react";
import { binding } from "@jayjnu/branded-ui-react";
import { AccountUI, type Account } from "./Account.ui";

const initialAccount: Account = {
  name: "Ada Lovelace",
  plan: "Team",
};

export const AccountPanel = binding(AccountUI)(({ Layout, States }) => {
  function AccountBinding() {
    const [account, setAccount] = useState<Account | null>(initialAccount);
    const [status, setStatus] = useState<"ready" | "pending" | "failed">(
      "ready",
    );

    if (status === "pending") {
      return (
        <Layout
          header={<States.pending.header.Title />}
          content={<States.pending.content.Skeleton />}
          footer={
            <States.pending.footer.Cancel
              onCancel={() => setStatus("ready")}
            />
          }
        />
      );
    }

    if (status === "failed") {
      return (
        <Layout
          header={<States.failed.header.Title />}
          content={<States.failed.content.Message />}
          footer={
            <States.failed.footer.Retry onRetry={() => setStatus("ready")} />
          }
        />
      );
    }

    if (!account) {
      return (
        <Layout
          header={<States.empty.header.Title />}
          content={<States.empty.content.Message />}
          footer={
            <States.empty.footer.Action
              onRestore={() => setAccount(initialAccount)}
            />
          }
        />
      );
    }

    return (
      <Layout
        header={<States.success.header.Title />}
        content={<States.success.content.Summary account={account} />}
        footer={
          <States.success.footer.Actions
            onPending={() => setStatus("pending")}
            onFailed={() => setStatus("failed")}
            onClear={() => setAccount(null)}
          />
        }
      />
    );
  }

  return AccountBinding;
});
