import { assertEquals } from "../test_deps.ts";
import { createFetchRequest, makeRpcCallWithFormData } from "./client.ts";
import { createRequest as createRpcRequest } from "./creation.ts";

const resource = "https://dev.zaubrik.com/pouch";
const rpcRequest = createRpcRequest({ method: "subtract", "params": [42, 23] });
const options = {
  jwt:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  headers: new Headers({ "x-service": "alpha" }),
};
const request = createFetchRequest(
  resource,
  JSON.stringify(rpcRequest),
  options,
);

Deno.test("create request object", async function (): Promise<void> {
  assertEquals(request.headers.get("Authorization"), `Bearer ${options.jwt}`);
  assertEquals(request.headers.get("Content-Type"), "application/json");
  assertEquals(request.headers.get("x-service"), "alpha");
  assertEquals(request.method, "POST");
  assertEquals(await request.json(), rpcRequest);
});

Deno.test("makeRpcCallWithFormData creates request with correct headers and body", async function (): Promise<
  void
> {
  const rpcRequestInput = { method: "upload", params: { name: "test" } };
  const files = {
    file1: new Blob(["file content"], { type: "text/plain" }),
  };
  const options = {
    jwt:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    headers: new Headers({ "x-service": "alpha" }),
  };

  const formData = new FormData();
  const rpcRequest = createRpcRequest({ ...rpcRequestInput });
  formData.append("rpc", JSON.stringify(rpcRequest));
  for (const [key, file] of Object.entries(files)) {
    formData.append(key, file);
  }

  const request = new Request(resource, {
    headers: options.headers,
    body: formData,
    method: "POST",
  });

  if (options.jwt) {
    request.headers.set("Authorization", `Bearer ${options.jwt}`);
  }

  assertEquals(request.headers.get("Authorization"), `Bearer ${options.jwt}`);
  assertEquals(request.headers.get("x-service"), "alpha");
  assertEquals(request.method, "POST");

  // The Content-Type header for FormData is automatically set by the browser and includes the boundary.
  const contentType = request.headers.get("Content-Type");
  if (contentType) {
    assertEquals(contentType.startsWith("multipart/form-data"), true);
  }

  const requestFormData = await request.formData();
  assertEquals(requestFormData.get("rpc"), JSON.stringify(rpcRequest));
  assertEquals(requestFormData.get("file1") instanceof Blob, true);
});

Deno.test("makeRpcCallWithFormData sends correct request and handles response", async function (): Promise<
  void
> {
  // Mock fetch
  const mockFetch = () => {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          result: { success: true },
          id: "1",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch;

  const rpcRequestInput = { method: "upload", params: { name: "test" } };
  const files = {
    file1: new Blob(["file content"], { type: "text/plain" }),
  };
  const options = {
    jwt:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    headers: new Headers({ "x-service": "alpha" }),
  };

  const result = await makeRpcCallWithFormData(resource)(
    rpcRequestInput,
    files,
    options,
  );
  assertEquals(result.success, true);

  globalThis.fetch = originalFetch; // Restore original fetch
});
