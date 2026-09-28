import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { recommended } from "../src/index.js";

const pluginPath = fileURLToPath(new URL("../src/index.js", import.meta.url));

test("reports direct Branded UI architecture violations", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "branded-ui-react-oxlint-"));

  try {
    const sourcePath = path.join(directory, "Broken.ui.tsx");
    const configPath = path.join(directory, ".oxlintrc.json");
    await writeFile(
      configPath,
      JSON.stringify({
        jsPlugins: [pluginPath],
        rules: {
          ...recommended,
          "branded-ui-react/no-binding-import-in-ui": [
            "error",
            { bindingFileSuffixes: [".controller"] },
          ],
        },
      }),
    );
    await writeFile(
      sourcePath,
      `import { asyncUI, binding } from "@jayjnu/branded-ui-react";
import { Page } from "./Page.controller";
const UI = asyncUI({});
export const RawView = () => <div />;
export const Bound = binding(UI)(({ Layout, States }) => () => (
  <Layout header={<States.success.content.List />} content={null} />
));
void Page;
`,
    );

    const result = spawnSync(
      "oxlint",
      ["--config", configPath, sourcePath],
      { encoding: "utf8" },
    );
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.match(output, /branded-ui-react\(correct-slot\)/);
    assert.match(output, /branded-ui-react\(no-binding-import-in-ui\)/);
    assert.match(output, /branded-ui-react\(no-raw-component-export\)/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("checks local named export specifiers without touching re-exports", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "branded-ui-react-oxlint-"),
  );

  try {
    const sourcePath = path.join(directory, "Exports.tsx");
    const configPath = path.join(directory, ".oxlintrc.json");
    await writeFile(
      configPath,
      JSON.stringify({
        jsPlugins: [pluginPath],
        rules: { "branded-ui-react/no-raw-component-export": "error" },
      }),
    );
    await writeFile(
      sourcePath,
      `import { pureUI } from "@jayjnu/branded-ui-react";

type TypeOnly = string;
function RawFunction() { return <div />; }
const RawArrow = () => <div />;
const RawWrapped = memo(() => <div />);
const Branded = pureUI(() => <div />);
export { RawFunction, RawArrow, RawWrapped, Branded };
export type { TypeOnly };
export { type TypeOnly as ExportedType };
export { External } from "./other";
`,
    );

    const result = spawnSync(
      "oxlint",
      ["--config", configPath, sourcePath],
      { encoding: "utf8" },
    );
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.equal(
      output.match(/branded-ui-react\(no-raw-component-export\)/g)?.length,
      3,
      output,
    );
    assert.match(output, /Exported component "RawFunction"/);
    assert.match(output, /Exported component "RawArrow"/);
    assert.match(output, /Exported component "RawWrapped"/);
    assert.doesNotMatch(output, /Exported component "Branded"/);
    assert.doesNotMatch(output, /Exported component "External"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("requires a named factory export only in configured page modules", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "branded-ui-react-oxlint-"));
  try {
    const configPath = path.join(directory, ".oxlintrc.json");
    await writeFile(configPath, JSON.stringify({
      jsPlugins: [pluginPath],
      overrides: [{
        files: ["**/*.page.ui.tsx"],
        rules: {
          "branded-ui-react/require-exported-ui-factory": [
            "error", { factory: "asyncUI", namePattern: "PageUI$" },
          ],
        },
      }, {
        files: ["static.page.ui.tsx"],
        rules: { "branded-ui-react/require-exported-ui-factory": "off" },
      }],
    }));
    async function check(name, source) {
      const file = path.join(directory, name);
      await writeFile(file, `import { asyncUI as asyncView, pureUI, layoutUI } from "@jayjnu/branded-ui-react";\n${source}\n`);
      const result = spawnSync("oxlint", ["--config", configPath, file], { encoding: "utf8" });
      return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
    }

    let result = await check("orders.page.ui.tsx", `
const Layout = layoutUI({});
const OrdersPageUI = asyncView({});
export { OrdersPageUI };
export const Helper = pureUI(() => null);
export type { External } from "./external";
`);
    assert.equal(result.status, 0, result.output);

    result = await check("orders.page.ui.tsx", `export const OrdersPageUI = pureUI(() => null);`);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /OrdersPageUI must use asyncUI, not pureUI/);
    assert.equal(result.output.match(/branded-ui-react\(require-exported-ui-factory\)/g)?.length, 1, result.output);

    result = await check("orders.page.ui.tsx", `const OrdersPageUI = asyncView({});`);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /must export at least 1 asyncUI contract matching \/PageUI\$/);

    result = await check("orders.page.ui.tsx", `
const Contract = asyncView({});
export { Contract as OrdersPageUI };
`);
    assert.equal(result.status, 0, result.output);

    result = await check("orders.page.ui.tsx", `
export const Helper = asyncView({});
export { External as OrdersPageUI } from "./external";
`);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /must export at least 1 asyncUI/);

    result = await check("orders.page.ui.tsx", `export const OrdersPageUI = () => null;`);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /OrdersPageUI must be declared with asyncUI\(\)/);

    result = await check("orders.page.ui.tsx", `
const OrdersPageUI = asyncView({});
export default OrdersPageUI;
`);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /must export at least 1 asyncUI/);

    result = await check("ordinary.ui.tsx", `export const OrdersPageUI = pureUI(() => null);`);
    assert.equal(result.status, 0, result.output);
    result = await check("static.page.ui.tsx", `export const StaticPageUI = pureUI(() => null);`);
    assert.equal(result.status, 0, result.output);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("counts distinct matching exports and supports other factories", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "branded-ui-react-oxlint-"));
  try {
    const configPath = path.join(directory, ".oxlintrc.json");
    const sourcePath = path.join(directory, "Contracts.tsx");
    await writeFile(configPath, JSON.stringify({
      jsPlugins: [pluginPath],
      rules: { "branded-ui-react/require-exported-ui-factory": ["error", { factory: "binding", minimum: 2 }] },
    }));
    await writeFile(sourcePath, `
import { binding } from "@jayjnu/branded-ui-react";
const First = binding(UI);
export { First };
export const Second = binding(UI);
`);
    let result = spawnSync("oxlint", ["--config", configPath, sourcePath], { encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    await writeFile(sourcePath, `
import { binding } from "@jayjnu/branded-ui-react";
const First = binding(UI);
export { First };
`);
    result = spawnSync("oxlint", ["--config", configPath, sourcePath], { encoding: "utf8" });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(`${result.stdout}\n${result.stderr}`, /must export at least 2 binding/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("allows only local and allowlisted calls in Pure UI declarations", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "branded-ui-react-oxlint-"),
  );

  try {
    const sourcePath = path.join(directory, "Calls.ui.tsx");
    const configPath = path.join(directory, ".oxlintrc.json");
    await writeFile(
      configPath,
      JSON.stringify({
        jsPlugins: [pluginPath],
        rules: {
          "branded-ui-react/no-external-call-in-pure-ui": [
            "error",
            { allowedCalls: ["formatLabel", "Math.max"] },
          ],
        },
      }),
    );
    await writeFile(
      sourcePath,
      `import {
  asyncUI as asyncView,
  layoutUI,
  pureUI as view,
  syncUI,
} from "@jayjnu/branded-ui-react";
import { formatLabel } from "./format";

export const CallsUI = view(({ items, onSelect }) => {
  const clean = (item) => item.trim();
  const labels = items.map(clean);
  const width = Math.max(labels.length, 1);
  const text = formatLabel(labels.join(","));
  useContext(AppContext);
  window.alert(text);
  new Date();
  return <button style={{ width }} onClick={() => onSelect(text)}>{text}</button>;
});

const Layout = layoutUI({
  component: ({ content }) => {
    useTheme();
    return <main>{content}</main>;
  },
  slots: ["content"],
});

syncUI({
  layout: Layout,
  slots: {
    content: {
      View: ({ text }) => {
        store.getState();
        return <span>{text.trim()}</span>;
      },
    },
  },
});

asyncView({
  layout: Layout,
  states: asyncView.states({
    success: {
      content: {
        View: () => {
          client.load();
          return null;
        },
      },
    },
  }),
  fallback: {
    layout: Layout,
    slots: {
      content: {
        Loading: () => {
          new URL("/", location.href);
          return null;
        },
      },
    },
  },
});
`,
    );

    const result = spawnSync(
      "oxlint",
      ["--config", configPath, sourcePath],
      { encoding: "utf8" },
    );
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.equal(
      output.match(/branded-ui-react\(no-external-call-in-pure-ui\)/g)?.length,
      7,
      output,
    );
    assert.match(output, /Call "useContext" is external/);
    assert.match(output, /Call "window\.alert" is external/);
    assert.match(output, /Constructor "Date" is external/);
    assert.match(output, /Call "useTheme" is external/);
    assert.match(output, /Call "store\.getState" is external/);
    assert.match(output, /Call "client\.load" is external/);
    assert.match(output, /Constructor "URL" is external/);
    assert.doesNotMatch(output, /Call "formatLabel" is external/);
    assert.doesNotMatch(output, /Call "Math\.max" is external/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("supports the dedicated hook rule with pattern/module policies", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "branded-ui-react-oxlint-granularity-"),
  );

  try {
    const sourcePath = path.join(directory, "Calls.ui.tsx");
    const configPath = path.join(directory, ".oxlintrc.json");
    await writeFile(
      configPath,
      JSON.stringify({
        jsPlugins: [pluginPath],
        rules: {
          "branded-ui-react/no-hook-call-in-pure-ui": [
            "error",
            {
              allowedCallPatterns: ["^use.*Translation$"],
              deniedCallPatterns: ["^useForm$"],
              deniedModules: ["react"],
            },
          ],
        },
      }),
    );
    await writeFile(
      sourcePath,
      `import { pureUI } from "@jayjnu/branded-ui-react";
import { useEffect, useState as state } from "react";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "@/shared/i18n";

export const CallsUI = pureUI(() => {
  state(0);
  useEffect(() => {}, []);
  useForm();
  useTranslation();
  Boolean(true);
  return null;
});
`,
    );

    const result = spawnSync(
      "oxlint",
      ["--config", configPath, sourcePath],
      { encoding: "utf8" },
    );
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.equal(
      output.match(/branded-ui-react\(no-hook-call-in-pure-ui\)/g)?.length,
      3,
      output,
    );
    assert.match(output, /Call "state" is external/);
    assert.match(output, /Call "useEffect" is external/);
    assert.match(output, /Call "useForm" is external/);
    assert.doesNotMatch(output, /Call "useTranslation" is external/);
    assert.doesNotMatch(output, /Call "Boolean" is external/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("allows and denies imported modules with glob patterns", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "branded-ui-react-oxlint-modules-"),
  );

  try {
    const sourcePath = path.join(directory, "Calls.ui.tsx");
    const configPath = path.join(directory, ".oxlintrc.json");
    await writeFile(
      configPath,
      JSON.stringify({
        jsPlugins: [pluginPath],
        rules: {
          "branded-ui-react/no-external-call-in-pure-ui": [
            "error",
            {
              allowedModules: ["@/shared/ui/**"],
              allowedCallPatterns: ["^formatLabel$"],
              deniedModules: ["@/domain/**"],
            },
          ],
        },
      }),
    );
    await writeFile(
      sourcePath,
      `import { pureUI } from "@jayjnu/branded-ui-react";
import { cn } from "@/shared/ui/cn";
import { formatLabel } from "./format";
import { validate } from "@/domain/forms";

export const CallsUI = pureUI(({ value }) => {
  cn("button");
  formatLabel(value);
  validate(value);
  return null;
});
`,
    );

    const result = spawnSync(
      "oxlint",
      ["--config", configPath, sourcePath],
      { encoding: "utf8" },
    );
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.equal(
      output.match(/branded-ui-react\(no-external-call-in-pure-ui\)/g)?.length,
      1,
      output,
    );
    assert.match(output, /Call "validate" is external/);
    assert.doesNotMatch(output, /Call "cn" is external/);
    assert.doesNotMatch(output, /Call "formatLabel" is external/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
