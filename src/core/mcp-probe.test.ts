import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchMcpToolsList, McpProbeError, parseToolsListResponse } from "./mcp-probe.js";

function mockFetch(handlers: Record<string, (init: RequestInit) => Response | Promise<Response>>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const handler = handlers[url];
    if (!handler) throw new Error(`unexpected fetch: ${url}`);
    return handler(init ?? {});
  }) as typeof fetch;
}

describe("mcp-probe", () => {
  it("MCP-PROBE-001: parses valid tools/list JSON", async () => {
    const tools = parseToolsListResponse({
      tools: [
        { name: "search", description: "Search", inputSchema: { type: "object" } },
        { name: "fetch", inputSchema: { type: "object", properties: {} } },
      ],
    });
    assert.equal(tools.length, 2);
    assert.equal(tools[0]?.name, "search");
  });

  it("MCP-PROBE-002: 4xx/5xx → McpProbeError with status", async () => {
    const fetchImpl = mockFetch({
      "https://mcp.bad.example/mcp": () =>
        new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
    });
    await assert.rejects(
      () => fetchMcpToolsList("https://mcp.bad.example/mcp", { fetchImpl, timeoutMs: 5_000 }),
      (err: unknown) => {
        assert.ok(err instanceof McpProbeError);
        assert.equal(err.status, 401);
        assert.match(err.message, /unauthorized/i);
        return true;
      },
    );
  });

  it("MCP-PROBE-003: timeout configurable", async () => {
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (init?.signal?.aborted) {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }
      return new Response(JSON.stringify({ result: { tools: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await assert.rejects(
      () => fetchMcpToolsList("https://mcp.slow.example/mcp", { fetchImpl, timeoutMs: 5 }),
      (err: unknown) => {
        assert.ok(err instanceof McpProbeError);
        assert.match(err.message, /timed out/i);
        return true;
      },
    );
  });

  it("fetchMcpToolsList runs initialize + tools/list", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { method?: string };
      calls.push(body.method ?? "unknown");
      if (body.method === "initialize") {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2024-11-05" } }), {
          status: 200,
          headers: { "content-type": "application/json", "mcp-session-id": "sess-1" },
        });
      }
      if (body.method === "notifications/initialized") {
        return new Response(null, { status: 202 });
      }
      if (body.method === "tools/list") {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            result: { tools: [{ name: "ping", description: "Ping" }] },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      throw new Error(`unexpected method ${body.method}`);
    }) as typeof fetch;

    const tools = await fetchMcpToolsList("https://mcp.ok.example/mcp", { fetchImpl, timeoutMs: 5_000 });
    assert.deepEqual(
      calls,
      ["initialize", "notifications/initialized", "tools/list"],
    );
    assert.equal(tools[0]?.name, "ping");
  });
});
