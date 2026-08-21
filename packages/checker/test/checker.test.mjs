import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkProject } from "../dist/index.js";

test("reports slot, dependency, and raw export violations", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "branded-ui-checker-"));

  try {
    await writeFile(
      path.join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          jsx: "preserve",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          target: "ES2022",
        },
        include: ["*.tsx"],
      }),
    );
    await writeFile(
      path.join(directory, "page.binding.tsx"),
      `import { binding } from "@jayjnu/branded-ui-react";
export const Page = binding({})(({ Layout, States }) => () => (
  <Layout header={<States.success.content.List />} content={null} />
));
export const RawView = () => <div />;
`,
    );
    await writeFile(
      path.join(directory, "view.ui.tsx"),
      `import { asyncUI } from "@jayjnu/branded-ui-react";
import { Page } from "./page.binding.js";
const declaration = asyncUI({});
void declaration;
void Page;
`,
    );

    const codes = checkProject(path.join(directory, "tsconfig.json")).map(
      (diagnostic) => diagnostic.code,
    );

    assert.deepEqual([...new Set(codes)].sort(), ["BUI001", "BUI002", "BUI003"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
