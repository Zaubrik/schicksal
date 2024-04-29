import { assertEquals, create, Payload } from "../test_deps.ts";
import { respond } from "./response.ts";
import { CustomError } from "./custom_error.ts";

function createReq(str: string) {
  return new Request("http://0.0.0.0:8000", { body: str, method: "POST" });
}

function removeWhiteSpace(str: string) {
  return JSON.stringify(JSON.parse(str));
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
  login: (_: unknown, { payload }: { payload: Payload }) => {
    return payload.user as string;
  },
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
        '{"jsonrpc": "2.0", "error": {"code": -32020, "message": "Authorization error"}, "id": 3}',
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
      '{"jsonrpc": "2.0", "error": {"code": -32020, "message": "Authorization error"}, "id": 3}',
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
      '{"jsonrpc": "2.0", "error": {"code": -32020, "message": "Authorization error"}, "id": 3}',
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
      removeWhiteSpace(
        '{"jsonrpc": "2.0", "error": {"code": -32020, "message": "Authorization error"}, "id": 3}',
      ),
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
});
