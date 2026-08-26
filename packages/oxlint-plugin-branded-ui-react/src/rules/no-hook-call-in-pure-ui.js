import { createNoExternalCallRule } from "./no-external-call-in-pure-ui.js";

export default createNoExternalCallRule({
  hooksOnly: true,
  description: "Disallow hook calls in Pure UI components",
});
