import type { Plugin } from "@oxlint/plugins";

export declare const recommended: Readonly<{
  "branded-ui-react/correct-slot": "error";
  "branded-ui-react/no-binding-import-in-ui": "error";
  "branded-ui-react/no-external-call-in-pure-ui": "error";
  "branded-ui-react/no-raw-component-export": "error";
}>;

declare const plugin: Plugin;
export default plugin;
