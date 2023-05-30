import { assertEquals } from "../test_deps.ts";
import { validateResponse } from "./validation.ts";

Deno.test("validate response object", function (): void {
  assertEquals(
    validateResponse({ jsonrpc: "2.0", result: 19, id: 3 }),
    { id: 3, jsonrpc: "2.0", result: 19 },
  );
  assertEquals(
    validateResponse({ jsonrpc: "2.0", result: 19, id: null }),
    { id: null, jsonrpc: "2.0", result: 19 },
  );

  assertEquals(
    validateResponse({ jsonrpc: ".0", result: 19, id: 3 }),
    {
      jsonrpc: "2.0",
      error: {
        code: 0,
        message: "Invalid JSON-RPC 2.0 response.",
      },
      id: null,
    },
  );
  assertEquals(
    validateResponse({ jsonrpc: "2.0", id: 3 }),
    {
      jsonrpc: "2.0",
      error: {
        code: 0,
        message: "Invalid JSON-RPC 2.0 response.",
      },
      id: null,
    },
  );
  assertEquals(
    validateResponse({
      jsonrpc: "2.0",
      result: 19,
      // deno-lint-ignore no-explicit-any
      id: undefined as any,
    }),
    {
      jsonrpc: "2.0",
      error: {
        code: 0,
        message: "Invalid JSON-RPC 2.0 response.",
      },
      id: null,
    },
  );
  assertEquals(
    validateResponse({
      jsonrpc: "2.0",
      error: { code: -32600 },
      id: null,
    }),
    {
      jsonrpc: "2.0",
      error: {
        code: 0,
        message: "Invalid JSON-RPC 2.0 response.",
      },
      id: null,
    },
  );
  assertEquals(
    validateResponse({
      jsonrpc: "2.0",
      error: { code: -32600, message: "Invalid Request" },
      id: null,
    }),
    {
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message: "Invalid Request",
      },
      id: null,
    },
  );
  assertEquals(
    validateResponse({ "jsonrpc": "2.0", "result": 19 }, true),
    {
      jsonrpc: "2.0",
      error: {
        code: 0,
        message: "The notification contains unexpected data.",
      },
      id: null,
    },
  );
});
