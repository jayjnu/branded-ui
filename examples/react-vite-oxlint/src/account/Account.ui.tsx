import type { ReactNode } from "react";
import { asyncUI, layoutUI } from "@jayjnu/branded-ui-react";

export type Account = {
  name: string;
  plan: string;
};

const AccountLayout = layoutUI({
  component: (props: {
    header: ReactNode;
    content: ReactNode;
    footer?: ReactNode;
  }) => (
    <section aria-labelledby="account-title">
      <header>{props.header}</header>
      <div>{props.content}</div>
      {props.footer && <footer>{props.footer}</footer>}
    </section>
  ),
  slots: ["header", "content", "footer"],
});

const Title = () => <h2 id="account-title">Account</h2>;

export const AccountUI = asyncUI({
  layout: AccountLayout,
  states: asyncUI.states({
    success: {
      header: { Title },
      content: {
        Summary: (props: { account: Account }) => (
          <dl>
            <dt>Name</dt>
            <dd>{props.account.name}</dd>
            <dt>Plan</dt>
            <dd>{props.account.plan}</dd>
          </dl>
        ),
      },
      footer: {
        Actions: (props: {
          onRefreshing: () => void;
          onFailed: () => void;
          onClear: () => void;
        }) => (
          <>
            <button type="button" onClick={props.onRefreshing}>
              Refresh
            </button>
            <button type="button" onClick={props.onFailed}>
              Simulate failure
            </button>
            <button type="button" onClick={props.onClear}>
              Sign out
            </button>
          </>
        ),
      },
    },
    empty: {
      header: { Title },
      content: { Message: () => <p>No active account.</p> },
      footer: {
        Action: (props: { onRestore: () => void }) => (
          <button type="button" onClick={props.onRestore}>
            Restore account
          </button>
        ),
      },
    },
    pending: {
      header: { Title },
      content: { Skeleton: () => <p>Loading account…</p> },
      footer: {
        Cancel: (props: { onCancel: () => void }) => (
          <button type="button" onClick={props.onCancel}>
            Cancel
          </button>
        ),
      },
    },
    failed: {
      header: { Title },
      content: {
        Message: () => <p role="alert">Could not load the account.</p>,
      },
      footer: {
        Retry: (props: { onRetry: () => void }) => (
          <button type="button" onClick={props.onRetry}>
            Retry
          </button>
        ),
      },
    },
    refreshing: {
      header: { Title },
      content: { Status: () => <p>Refreshing account details…</p> },
      footer: {
        Cancel: (props: { onCancel: () => void }) => (
          <button type="button" onClick={props.onCancel}>
            Cancel refresh
          </button>
        ),
      },
    },
  }),
});
