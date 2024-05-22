import { assertEquals, create } from "../test_deps.ts";
import { type JsonObject } from "../types.ts";
import { type Options, respond } from "./response.ts";
import { CustomError } from "./custom_error.ts";
import { numberArrayValidator } from "../helpers/server/validation.ts";

function createReq(str: string) {
  return new Request("http://0.0.0.0:8000", { body: str, method: "POST" });
}

function removeWhiteSpace(str: string) {
  return JSON.stringify(JSON.parse(str));
}

function add([a, b]: [number, number]) {
  return a + b;
}

// Mock method for testing
function mockMethod(
  // deno-lint-ignore no-explicit-any
  params: Record<string, any>,
  args: { blobs: Record<string, Blob> },
) {
  return {
    params,
    blobs: Object.keys(args.blobs).map((key) => args.blobs[key].type),
  };
}

const methods = {
  // deno-lint-ignore no-explicit-any
  subtract: (input: any) =>
    Array.isArray(input)
      ? input[0] - input[1]
      : input.minuend - input.subtrahend,
  sum: (arr: number[]) => arr.reduce((acc, el) => acc + el),
  queryDatabase: ({ name, s }: { name: string; s: string }) => `${s} ${name}`,
  notify_hello: () => "hello",
  get_data: () => ["hello", 5],
  throwError: () => {
    throw new Error("my error");
  },
  throwCustomError: () => {
    throw new CustomError(-32000, "my custom error", {
      "details": "error details",
    });
  },
  login: (_: unknown, { payload }: { payload: JsonObject }) => {
    return payload.user as string;
  },
  add: { method: add, validation: numberArrayValidator },
  upload: mockMethod,
};

const cryptoKey = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-384" },
  true,
  ["sign", "verify"],
);
const algorithm = "HS384" as const;
const jwt = await create(
  { alg: algorithm, typ: "JWT" },
  { user: "Bob" },
  cryptoKey,
);

Deno.test("rpc call with positional parameters", async function (): Promise<
  void
> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "subtract", "params": [42, 23], "id": 1}';
  const sentToClient = '{"jsonrpc": "2.0", "result": 19, "id": 1}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call with named parameters", async function (): Promise<void> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 23, "minuend": 42}, "id": 3}';
  const sentToClient = '{"jsonrpc": "2.0", "result": 19, "id": 3}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call as a notification", async function (): Promise<void> {
  let sentToServer =
    '{"jsonrpc": "2.0", "method": "update", "params": [1,2,3,4,5]}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    "",
  );

  sentToServer = '{"jsonrpc": "2.0", "method": "foobar"}';
  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    "",
  );
});

Deno.test("rpc call of non-existent method", async function (): Promise<void> {
  const sentToServer = '{"jsonrpc": "2.0", "method": "foobar", "id": "1"}';
  const sentToClient =
    '{"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found"}, "id": "1"}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call with invalid request object", async function (): Promise<
  void
> {
  const sentToServer = '{"jsonrpc": "2.0", "method": 1, "params": "bar"}';
  const sentToClient =
    '{"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call invalid params", async function (): Promise<void> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "subtract", "params": 42, "id": 1}';
  const sentToClient =
    '{"jsonrpc": "2.0", "error": {"code": -32602, "message": "Invalid params"}, "id": 1}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call internal error", async function (): Promise<void> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "throwError", "params": ["error"], "id": 1}';
  const sentToClient =
    '{"jsonrpc": "2.0", "error": {"code": -32603, "message": "Internal error"}, "id": 1}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call with invalid JSON", async function (): Promise<void> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "foobar, "params": "bar", "baz]';
  const sentToClient =
    '{"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}, "id": null}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call Batch, invalid JSON", async function (): Promise<void> {
  const sentToServer =
    '[ {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"}, {"jsonrpc": "2.0", "method" ]';
  const sentToClient =
    '{"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}, "id": null}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call with an empty Array", async function (): Promise<void> {
  const sentToServer = "[]";
  const sentToClient =
    '{"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test(
  "rpc call with an invalid Batch (but not empty)",
  async function (): Promise<void> {
    const sentToServer = "[1]";
    const sentToClient =
      '[ {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null} ]';

    assertEquals(
      await (await respond(methods)(createReq(sentToServer))).text(),
      removeWhiteSpace(sentToClient),
    );
  },
);

Deno.test("rpc call with invalid Batch", async function (): Promise<void> {
  const sentToServer = "[1,2,3]";
  const sentToClient =
    '[ {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null}, {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null}, {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null} ]';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call Batch", async function (): Promise<void> {
  const sentToServer =
    '[ {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"}, {"jsonrpc": "2.0", "method": "notify_hello", "params": [7]}, {"jsonrpc": "2.0", "method": "subtract", "params": [42,23], "id": "2"}, {"foo": "boo"}, {"jsonrpc": "2.0", "method": "foo.get", "params": {"name": "myself"}, "id": "5"}, {"jsonrpc": "2.0", "method": "get_data", "id": "9"} ]';
  const sentToClient =
    '[ {"jsonrpc": "2.0", "result": 7, "id": "1"}, {"jsonrpc": "2.0", "result": 19, "id": "2"}, {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request"}, "id": null}, {"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found"}, "id": "5"}, {"jsonrpc": "2.0", "result": ["hello", 5], "id": "9"} ]';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call Batch (all notifications)", async function (): Promise<
  void
> {
  const sentToServer =
    '[ {"jsonrpc": "2.0", "method": "notify_sum", "params": [1,2,4]}, {"jsonrpc": "2.0", "method": "notify_hello", "params": [7]} ]';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    "",
  );
});

Deno.test("rpc call with publicErrorStack set to true", async function (): Promise<
  void
> {
  const sentToServer = '{"jsonrpc": "2.0", "method": "throwError", "id": 3}';

  assertEquals(
    typeof JSON.parse(
      await (await respond(methods)(createReq(sentToServer))).text(),
    ).error.data,
    "undefined",
  );
  assertEquals(
    typeof JSON.parse(
      await (await respond(methods, {
        publicErrorStack: true,
      })(createReq(sentToServer))).text(),
    ).error.data,
    "string",
  );
});

Deno.test("rpc call with validation", async function (): Promise<
  void
> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "add", "params": [10, 20], "id": 1}';
  const sentToClient = '{"jsonrpc":"2.0","result":30,"id":1}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});
Deno.test("rpc call with failed validation", async function (): Promise<
  void
> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "add", "params": [10, "invalid"], "id": 1}';
  const sentToClient =
    '{"jsonrpc":"2.0","error":{"code":-32030,"message":"Failed params validation","data":{"ok":false,"code":"invalid_type","expected":["number"],"path":[1]}},"id":1}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call with a custom error", async function (): Promise<
  void
> {
  const sentToServer =
    '{"jsonrpc": "2.0", "method": "throwCustomError", "params": [], "id": 1}';
  const sentToClient =
    '{"jsonrpc":"2.0","error":{"code":-32000,"message":"my custom error","data":{"details":"error details"}},"id":1}';

  assertEquals(
    await (await respond(methods)(createReq(sentToServer))).text(),
    removeWhiteSpace(sentToClient),
  );
});

Deno.test("rpc call with jwt", async function (): Promise<void> {
  const sentToServer = '{"jsonrpc": "2.0", "method": "login", "id": 3}';
  const sentToClient = '{"jsonrpc": "2.0", "result": "Bob", "id": 3}';
  const authorizationError =
    '{"jsonrpc": "2.0", "error": {"code": -32020, "message": "Failed authorization"}, "id": 3}';
  const reqOne = createReq(sentToServer);
  reqOne.headers.append("Authorization", `Bearer ${jwt}`);
  assertEquals(
    await (await respond(methods)(reqOne)).text(),
    removeWhiteSpace(
      '{"jsonrpc": "2.0", "error": {"code": -32603, "message": "Internal error"}, "id": 3}',
    ),
  );
  const reqTwo = createReq(sentToServer);
  reqTwo.headers.append("Authorization", `Bearer ${jwt.slice(1)}`),
    assertEquals(
      await (await respond(methods, {}, {
        methods: ["login"],
        verification: cryptoKey,
      })(
        reqTwo,
      )).text(),
      removeWhiteSpace(
        authorizationError,
      ),
    );
  const reqThree = createReq(
    '{"jsonrpc": "2.0", "method": "login", "params": {"user": "Bob"}, "id": 3}',
  );
  reqThree.headers.append("Authorization", `Bearer ${jwt.slice(1)}`);
  assertEquals(
    await (await respond(methods, {}, {
      verification: cryptoKey,
      methods: new RegExp(".+"),
    })(reqThree)).text(),
    removeWhiteSpace(
      authorizationError,
    ),
  );
  const reqFour = createReq(
    '{"jsonrpc": "2.0", "method": "login", "params": {"user": "Bob"}, "id": 3}',
  );
  reqFour.headers.append("Authorization", `Bearer ${jwt}`);
  assertEquals(
    await (await respond(methods, {}, {
      verification: cryptoKey,
      methods: ["non-existent"],
    })(reqFour)).text(),
    removeWhiteSpace(
      '{"jsonrpc": "2.0", "error": {"code": -32603, "message": "Internal error"}, "id": 3}',
    ),
  );
  const reqFive = createReq(
    '{"jsonrpc": "2.0", "method": "login", "params": {"user": "Bob"}, "id": 3}',
  );
  assertEquals(
    await (await respond(methods, {}, {
      verification: cryptoKey,
      methods: ["login"],
    })(reqFive)).text(),
    removeWhiteSpace(
      authorizationError,
    ),
  );
  const reqSix = createReq(sentToServer);
  reqSix.headers.append("Authorization", `Bearer ${jwt}`);
  assertEquals(
    await (await respond(methods, {}, {
      verification: cryptoKey,
      methods: ["login"],
    })(
      reqSix,
    )).text(),
    removeWhiteSpace(sentToClient),
  );
  const reqSeven = createReq(sentToServer);
  reqSeven.headers.append("Authorization", `Bearer ${jwt.slice(1)}`),
    assertEquals(
      await (await respond(methods, {}, [{
        methods: ["non-existent"],
        verification: cryptoKey,
      }, {
        methods: ["login"],
        verification: cryptoKey,
      }])(
        reqSeven,
      )).text(),
      removeWhiteSpace(authorizationError),
    );
  const reqEight = createReq(sentToServer);
  reqEight.headers.append("Authorization", `Bearer ${jwt}`),
    assertEquals(
      await (await respond(methods, {}, [{
        methods: ["non-existent"],
        verification: cryptoKey,
      }, {
        methods: ["login"],
        verification: cryptoKey,
      }])(
        reqEight,
      )).text(),
      removeWhiteSpace(sentToClient),
    );
  const reqNine = createReq(sentToServer);
  reqNine.headers.append("Authorization", `Bearer ${jwt}`),
    assertEquals(
      await (await respond(methods, {}, [{
        methods: ["login"],
        verification: cryptoKey,
      }, {
        methods: ["login"],
        verification: cryptoKey,
        options: {
          predicates: [() => false],
        },
      }])(
        reqNine,
      )).text(),
      removeWhiteSpace(authorizationError),
    );
});

Deno.test("respondByHandlingFormData handles form-data requests correctly", async () => {
  const options: Options = { acceptFormData: true };
  const fileContent = "file content";
  const file = new File([fileContent], "test.txt", { type: "text/plain" });

  const formData = new FormData();
  formData.append(
    "rpc",
    JSON.stringify({ jsonrpc: "2.0", method: "upload", id: "10" }),
  );
  formData.append("file1", file);
  const request = new Request("http://localhost", {
    method: "POST",
    body: formData,
  });

  const responseHandler = respond(methods, options);
  const response = await responseHandler(request);
  const responseBody = await response.json();

  assertEquals(response.status, 200);
  assertEquals(responseBody.jsonrpc, "2.0");
  assertEquals(responseBody.result.blobs, ["text/plain"]);
});

Deno.test("respondByHandlingFormData returns error for missing rpc field", async () => {
  const options: Options = { acceptFormData: true };
  const formData = new FormData();
  const request = new Request("http://localhost", {
    method: "POST",
    body: formData,
  });

  const responseHandler = respond(methods, options);
  const response = await responseHandler(request);
  const responseBody = await response.json();

  assertEquals(response.status, 200);
  assertEquals(responseBody.jsonrpc, "2.0");
  assertEquals(responseBody.error.code, -32040);
});
