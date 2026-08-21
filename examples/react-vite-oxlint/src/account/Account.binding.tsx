import { useState } from "react";
import { asyncUI, binding } from "@jayjnu/branded-ui-react";
import { AccountUI, type Account } from "./Account.ui";

const initialAccount: Account = {
  name: "Ada Lovelace",
  plan: "Team",
};

export const AccountPanel = binding(AccountUI)(({ Layout, States }) => {
  function AccountBinding() {
    const [account, setAccount] = useState<Account | null>(initialAccount);
    const [status, setStatus] = useState<
      "ready" | "pending" | "failed" | "refreshing"
    >("ready");
    const state = status === "ready" ? (account ? "success" : "empty") : status;

    return asyncUI.exhaustive(state, States, {
      success: (Success) =>
        account ? (
          <Layout
            header={<Success.header.Title />}
            content={<Success.content.Summary account={account} />}
            footer={
              <Success.footer.Actions
                onRefreshing={() => setStatus("refreshing")}
                onFailed={() => setStatus("failed")}
                onClear={() => setAccount(null)}
              />
            }
          />
        ) : null,
      empty: (Empty) => (
        <Layout
          header={<Empty.header.Title />}
          content={<Empty.content.Message />}
          footer={
            <Empty.footer.Action onRestore={() => setAccount(initialAccount)} />
          }
        />
      ),
      pending: (Pending) => (
        <Layout
          header={<Pending.header.Title />}
          content={<Pending.content.Skeleton />}
          footer={
            <Pending.footer.Cancel onCancel={() => setStatus("ready")} />
          }
        />
      ),
      failed: (Failed) => (
        <Layout
          header={<Failed.header.Title />}
          content={<Failed.content.Message />}
          footer={<Failed.footer.Retry onRetry={() => setStatus("ready")} />}
        />
      ),
      refreshing: (Refreshing) => (
        <Layout
          header={<Refreshing.header.Title />}
          content={<Refreshing.content.Status />}
          footer={
            <Refreshing.footer.Cancel onCancel={() => setStatus("ready")} />
          }
        />
      ),
    });
  }

  return AccountBinding;
});
