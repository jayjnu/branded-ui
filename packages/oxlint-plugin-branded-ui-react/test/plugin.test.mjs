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
      JSON.stringify({ jsPlugins: [pluginPath], rules: recommended }),
    );
    await writeFile(
      sourcePath,
      `import { asyncUI, binding } from "@jayjnu/branded-ui-react";
import { Page } from "./Page.binding";
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
