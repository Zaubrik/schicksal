import { createRpcResponseOrBatch } from "./creation.ts";
import { validateRequest } from "./validation.ts";
import type { JsonValue } from "../rpc_types.ts";
import type { VerifyOptions } from "./deps.ts";

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
    key: CryptoKey;
    methods?: (keyof Methods)[] | RegExp;
    allMethods?: boolean;
    options?: VerifyOptions;
  };
};

export function respond(methods: Methods, options: Options = {}) {
  return async (request: Request): Promise<Response> => {
    const authHeader = request.headers.get("Authorization");
    const validationObjectOrBatch = validateRequest(
      await request.text(),
      methods,
    );
    const headers = options.headers ?? new Headers();
    const rpcResponseOrBatchOrNull = await createRpcResponseOrBatch(
      validationObjectOrBatch,
      methods,
      options,
      authHeader,
    );
    if (rpcResponseOrBatchOrNull === null) {
      return new Response(null, { status: 204, headers });
    } else {
      headers.append("content-type", "application/json");
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
