import { useState } from "react";
import { binding } from "@jayjnu/branded-ui-react";
import { AccountUI, type Account } from "./Account.ui";

const initialAccount: Account = {
  name: "Ada Lovelace",
  plan: "Team",
};

export const AccountPanel = binding(AccountUI)((
  { Layout, Success, Empty, Pending, Failed },
) => {
  function AccountBinding() {
    const [account, setAccount] = useState<Account | null>(initialAccount);
    const [status, setStatus] = useState<"ready" | "pending" | "failed">(
      "ready",
    );

    if (status === "pending") {
      return (
        <Layout
          header={<Pending.header.Title />}
          content={<Pending.content.Skeleton />}
          footer={
            <Pending.footer.Cancel onCancel={() => setStatus("ready")} />
          }
        />
      );
    }

    if (status === "failed") {
      return (
        <Layout
          header={<Failed.header.Title />}
          content={<Failed.content.Message />}
          footer={<Failed.footer.Retry onRetry={() => setStatus("ready")} />}
        />
      );
    }

    if (!account) {
      return (
        <Layout
          header={<Empty.header.Title />}
          content={<Empty.content.Message />}
          footer={
            <Empty.footer.Action onRestore={() => setAccount(initialAccount)} />
          }
        />
      );
    }

    return (
      <Layout
        header={<Success.header.Title />}
        content={<Success.content.Summary account={account} />}
        footer={
          <Success.footer.Actions
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
