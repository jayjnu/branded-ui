import correctSlot from "./rules/correct-slot.js";
import noBindingImportInUI from "./rules/no-binding-import-in-ui.js";
import noRawComponentExport from "./rules/no-raw-component-export.js";

export { recommended } from "./recommended.js";

export default {
  meta: { name: "branded-ui-react" },
  rules: {
    "correct-slot": correctSlot,
    "no-binding-import-in-ui": noBindingImportInUI,
    "no-raw-component-export": noRawComponentExport,
  },
};
