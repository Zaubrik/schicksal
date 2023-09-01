import { createRpcResponseOrBatch } from "./creation.ts";
import { validateRequest } from "./validation.ts";
import { type JsonValue } from "../rpc_types.ts";
import {
  type CryptoKeyOrUpdateInput,
  verifyJwt,
  type VerifyOptions,
} from "./deps.ts";

export type Methods = {
  // deno-lint-ignore no-explicit-any
  [method: string]: (...arg: any[]) => JsonValue | Promise<JsonValue>;
};
export type Options = {
  // Add response headers:
  headers?: Headers;
  // Include server side error messages in response:
  publicErrorStack?: boolean;
  // Additional arguments ('payload' is reserved for jwt payload!):
  args?: Record<string, unknown>;
  // Verify JWTs:
  auth?: {
    input: CryptoKeyOrUpdateInput;
    methods?: (keyof Methods)[] | RegExp;
    options?: VerifyOptions;
  };
};
export type AuthData = {
  headers: Headers;
  verify?: ReturnType<typeof verifyJwt>;
};

export function respond(options: Options = {}) {
  const verify = options.auth
    ? verifyJwt(options.auth.input, options.auth.options)
    : undefined;
  return async (request: Request, methods: Methods): Promise<Response> => {
    const authData = { verify, headers: request.headers };
    const validationObjectOrBatch = validateRequest(
      await request.text(),
      methods,
    );
    const headers = options.headers ?? new Headers();
    const rpcResponseOrBatchOrNull = await createRpcResponseOrBatch(
      validationObjectOrBatch,
      methods,
      options,
      authData,
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

export const makeRpcResponse = respond();
