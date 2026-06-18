import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolResultSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, it } from "node:test";
import { assertWatchStatusPlane } from "./watch-status-contract.js";

const EXPECTED_TOOLS = [
  "assert_a2a_coverage",
  "assert_coverage",
  "check_watch",
  "compare_json",
  "explain_drift",
  "get_watch_status",
  "get_agent_status",
  "list_affected_agents",
  "acknowledge_drift",
  "trigger_remediation",
  "hosted_info",
  "list_drift_events",
  "list_watches",
  "parse_mcp_config",
  "register_watch",
  "suggest_watches",
];

describe("server.ts entry orchestration", { concurrency: 1 }, () => {
  let origConnect: typeof McpServer.prototype.connect;
  let origFetch: typeof globalThis.fetch;
  const watchId = "00000000-0000-4000-8000-000000000001";

  afterEach(() => {
    if (origConnect) {
      McpServer.prototype.connect = origConnect;
    }
    if (origFetch) {
      globalThis.fetch = origFetch;
    }
    delete process.env.DRIFTGUARD_API_KEY;
  });

  it("does not auto-start when imported as a library", async () => {
    origConnect = McpServer.prototype.connect;
    let connectCalled = false;
    McpServer.prototype.connect = async function () {
      connectCalled = true;
    };

    await import("./server.js");
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(connectCalled, false);
  });

  it("startMcpServer wires stdio transport and registers tools", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    let connectedTransport: unknown;

    origConnect = McpServer.prototype.connect;
    McpServer.prototype.connect = async function (transport: unknown) {
      connectedTransport = transport;
      return origConnect.call(this, serverTransport);
    };

    const { startMcpServer } = await import("./server.js");
    await startMcpServer();

    assert.ok(connectedTransport instanceof StdioServerTransport);

    const client = new Client({ name: "driftguard-test", version: "0" });
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      [...EXPECTED_TOOLS].sort(),
    );

    const response = (await client.callTool(
      {
        name: "compare_json",
        arguments: { before: '{"x":1}', after: '{"x":1}' },
      },
      CallToolResultSchema,
    )) as CallToolResult;
    assert.notEqual(response.isError, true);
    const textBlock = response.content.find((block) => block.type === "text");
    assert.equal(textBlock?.type, "text");
    if (textBlock?.type !== "text") return;

    const diff = JSON.parse(textBlock.text) as { breakingCount: number };
    assert.equal(diff.breakingCount, 0);

    const infoResponse = (await client.callTool(
      { name: "hosted_info", arguments: {} },
      CallToolResultSchema,
    )) as CallToolResult;
    const infoText = infoResponse.content.find((block) => block.type === "text");
    assert.equal(infoText?.type, "text");
    if (infoText?.type !== "text") return;
    const info = JSON.parse(infoText.text) as { primaryActivationEnv?: string };
    assert.equal(info.primaryActivationEnv, "DRIFTGUARD_API_KEY");

    await client.close();
  });

  it("OSS-1: get_watch_status proxies CP-0.2 status plane shape", async () => {
    const statusFixture = {
      watchId,
      name: "vendor-mcp",
      url: "https://mcp.vendor.example/sse",
      watchType: "mcp",
      driftStatus: "drifted",
      lastCheckedAt: "2026-06-18T12:00:00.000Z",
      lastCheckStatus: "ok",
      lastError: null,
      failureClass: null,
      failureLabel: null,
      health: {
        band: "degraded",
        isStaleCheck: false,
        minutesSinceLastCheck: 5,
        expectedIntervalMinutes: 30,
      },
      incident: {
        status: "open",
        key: "pd-abc",
        at: "2026-06-18T12:00:01.000Z",
        breakingCount: 1,
      },
      lastDriftEvent: {
        id: "evt-1",
        detectedAt: "2026-06-18T12:00:01.000Z",
        breakingCount: 1,
        warningCount: 0,
        infoCount: 0,
        changes: [
          {
            path: "tools.refund",
            severity: "breaking",
            changeType: "removed",
            message: "MCP tool 'refund' was removed",
            agentAction: "Remove refund skill from agent card or restore MCP tool",
          },
        ],
      },
      agentActions: ["Remove refund skill from agent card or restore MCP tool"],
    };

    origFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes(`/api/watches/${watchId}/status`)) {
        return new Response(JSON.stringify(statusFixture), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    };
    process.env.DRIFTGUARD_API_KEY = "dg_test_contract";

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    origConnect = McpServer.prototype.connect;
    McpServer.prototype.connect = async function (transport: unknown) {
      return origConnect.call(this, serverTransport);
    };

    const { startMcpServer } = await import("./server.js");
    await startMcpServer();

    const client = new Client({ name: "driftguard-test", version: "0" });
    await client.connect(clientTransport);

    const response = (await client.callTool(
      { name: "get_watch_status", arguments: { watchId } },
      CallToolResultSchema,
    )) as CallToolResult;
    assert.notEqual(response.isError, true);
    const textBlock = response.content.find((block) => block.type === "text");
    assert.equal(textBlock?.type, "text");
    if (textBlock?.type !== "text") return;

    const payload = JSON.parse(textBlock.text);
    assertWatchStatusPlane(payload);
    assert.equal(payload.watchId, watchId);
    assert.equal(payload.driftStatus, "drifted");
    assert.equal(payload.agentActions.length, 1);

    await client.close();
  });
});
