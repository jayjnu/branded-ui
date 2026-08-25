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
