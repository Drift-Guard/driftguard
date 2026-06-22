import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseLockfile } from "@driftguard/diff-core";
import { parseLockArgs, runLock, type LockRunDeps } from "./lock-run.js";

describe("lock-run", () => {
  it("parseLockArgs reads url, config, and output", () => {
    const opts = parseLockArgs(["--url", "https://mcp.example.com/mcp", "-o", "out.json"]);
    assert.equal(opts.url, "https://mcp.example.com/mcp");
    assert.equal(opts.outputPath, "out.json");
    assert.equal(opts.update, false);
  });

  it("CLI-LOCK-001: lock --url writes v1 file matching spec shape", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-lock-"));
    const out = join(dir, "driftguard-lock.json");
    const writes: string[] = [];
    const deps: LockRunDeps = {
      fetchTools: async () => [
        {
          name: "search_products",
          description: "Search the product catalog",
          inputSchema: { type: "object", properties: { query: { type: "string" } } },
        },
      ],
      writeFile: (_path, content) => writes.push(content),
    };

    const code = await runLock(["--url", "https://mcp.stripe.com/mcp", "-o", out], deps);
    assert.equal(code, 0);
    const lockfile = parseLockfile(JSON.parse(writes[0]!));
    assert.equal(lockfile.lockfileVersion, 1);
    assert.equal(lockfile.generator, "@driftguard/driftguard");
    assert.equal(lockfile.servers[0]?.transport, "streamable-http");
    assert.equal(lockfile.servers[0]?.tools[0]?.name, "search_products");
    rmSync(dir, { recursive: true, force: true });
  });

  it("CLI-LOCK-002: lock --config mcp.json includes all HTTP servers", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-lock-"));
    const configPath = join(dir, "mcp.json");
    const out = join(dir, "driftguard-lock.json");
    const config = {
      mcpServers: {
        alpha: { url: "https://alpha.example/mcp" },
        beta: { url: "https://beta.example/mcp" },
      },
    };
    const fetched: string[] = [];
    const deps: LockRunDeps = {
      readFile: (path) => (path === configPath ? JSON.stringify(config) : ""),
      fetchTools: async (url) => {
        fetched.push(url);
        return [{ name: "tool", inputSchema: { type: "object" } }];
      },
      writeFile: (path, content) => {
        assert.equal(path, out);
        const lockfile = parseLockfile(JSON.parse(content));
        assert.equal(lockfile.servers.length, 2);
      },
    };

    const code = await runLock(["--config", configPath, "-o", out], deps);
    assert.equal(code, 0);
    const sortedUrls = [...fetched].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(sortedUrls, ["https://alpha.example/mcp", "https://beta.example/mcp"]);
    rmSync(dir, { recursive: true, force: true });
  });

  it("CLI-LOCK-003: --update overwrites in place", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-lock-"));
    const out = join(dir, "driftguard-lock.json");
    const existing = {
      lockfileVersion: 1,
      generator: "@driftguard/driftguard",
      generatedAt: "2026-01-01T00:00:00.000Z",
      servers: [
        {
          name: "demo",
          transport: "streamable-http",
          url: "https://demo.example/mcp",
          tools: [{ name: "old_tool", inputSchema: { type: "object" } }],
        },
      ],
    };
    let written = "";
    const deps: LockRunDeps = {
      readFile: () => JSON.stringify(existing),
      fetchTools: async () => [{ name: "new_tool", inputSchema: { type: "object" } }],
      writeFile: (path, content) => {
        assert.equal(path, out);
        written = content;
      },
    };

    const code = await runLock(["--update", "-o", out], deps);
    assert.equal(code, 0);
    const lockfile = parseLockfile(JSON.parse(written));
    assert.equal(lockfile.servers[0]?.tools[0]?.name, "new_tool");
    rmSync(dir, { recursive: true, force: true });
  });

  it("CLI-LOCK-004: succeeds without DRIFTGUARD_API_KEY", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-lock-"));
    const out = join(dir, "driftguard-lock.json");
    const deps: LockRunDeps = {
      fetchTools: async () => [{ name: "ping", inputSchema: { type: "object" } }],
      writeFile: () => {},
    };
    const code = await runLock(["--url", "https://mcp.example.com/mcp", "-o", out], deps);
    assert.equal(code, 0);
    rmSync(dir, { recursive: true, force: true });
  });
});
