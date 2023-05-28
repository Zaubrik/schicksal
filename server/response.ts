import { createRpcResponseOrBatch } from "./creation.ts";
import { validateRequest } from "./validation.ts";
import type { JsonValue } from "../rpc_types.ts";

export type Methods = {
  // deno-lint-ignore no-explicit-any
  [method: string]: (...arg: any[]) => JsonValue | Promise<JsonValue>;
};
export type Options = {
  // Add headers to the default header '{"content-type" : "application/json"}':
  headers?: Headers;
  // include or don't include server side error messages in response:
  publicErrorStack?: boolean;
  // Additional arguments:
  args?: Record<string, unknown>;
  // for jwt verification:
  auth?: {
    key?: CryptoKey;
    methods?: (keyof Methods)[];
    allMethods?: boolean;
    jwt?: string | null;
  };
};

export function respond(methods: Methods, {
  headers = new Headers(),
  publicErrorStack = false,
  auth = {},
  args = {},
}: Options = {}) {
  return async (request: Request): Promise<Response> => {
    const authHeader = request.headers.get("Authorization");
    const validationObjectOrBatch = validateRequest(
      await request.text(),
      methods,
    );
    const options = { headers, publicErrorStack, auth, args };
    const rpcResponseOrBatchOrNull = await createRpcResponseOrBatch(
      validationObjectOrBatch,
      methods,
      options,
      authHeader,
    );
    if (rpcResponseOrBatchOrNull === null) {
      return new Response(null, { status: 204, headers });
    } else {
      options.headers.append("content-type", "application/json");
      return new Response(
        JSON.stringify(rpcResponseOrBatchOrNull),
        {
          status: 200,
          headers,
        },
      );
    }
  };
}
