#!/usr/bin/env node
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
await import(require.resolve("@drift-guard/driftguard/dist/cli/check.js"));
