#!/usr/bin/env node
import path from "node:path";
import { checkProject } from "./index.js";

const configPath = process.argv[2] ?? "tsconfig.json";

try {
  const diagnostics = checkProject(configPath);
  for (const diagnostic of diagnostics) {
    console.error(
      `${path.relative(process.cwd(), diagnostic.file)}:${diagnostic.line}:${diagnostic.column} ${diagnostic.code} ${diagnostic.message}`,
    );
  }
  if (diagnostics.length > 0) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
