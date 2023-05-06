import { assertEquals, assertNotEquals } from "./test_deps.ts";
import { createRequest } from "./creation.ts";

Deno.test("create request object", function (): void {
  assertEquals(
    createRequest({
      method: "subtract",
      params: [42, 23],
      isNotification: true,
    }),
    { jsonrpc: "2.0", method: "subtract", params: [42, 23] },
  );
  assertEquals(
    createRequest({
      method: "subtract",
      params: [42, 23],
      isNotification: true,
      id: 22,
    }),
    { jsonrpc: "2.0", method: "subtract", params: [42, 23] },
  );
  assertEquals(
    createRequest({
      method: "subtract",
      params: { a: 1, b: 2 },
      id: "abc",
    }),
    { jsonrpc: "2.0", method: "subtract", params: { a: 1, b: 2 }, id: "abc" },
  );
  assertEquals(
    createRequest({
      method: "subtract",
      isNotification: false,
      id: 123,
    }),
    { jsonrpc: "2.0", method: "subtract", id: 123 },
  );
  assertNotEquals(
    createRequest({
      method: "subtract",
      params: [42, 23],
    }),
    { jsonrpc: "2.0", method: "subtract", params: [42, 23] },
  );
});
