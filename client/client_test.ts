import { assertEquals } from "./test_deps.ts";
import { createFetchRequest } from "./client.ts";
import { createRequest as createRpcRequest } from "./creation.ts";

const resource = "https://dev.zaubrik.com/pouch";
const rpcRequest = createRpcRequest({ method: "subtract", "params": [42, 23] });
const options = {
  jwt:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  headers: new Headers({ "x-service": "alpha" }),
};
const request = createFetchRequest(resource, rpcRequest, options);

Deno.test("create request object", async function (): Promise<void> {
  assertEquals(request.headers.get("Authorization"), `Bearer ${options.jwt}`);
  assertEquals(request.headers.get("Content-Type"), "application/json");
  assertEquals(request.headers.get("x-service"), "alpha");
  assertEquals(request.method, "POST");
  assertEquals(await request.json(), rpcRequest);
});
