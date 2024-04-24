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
  // Include server side error messages in response (default: false):
  publicErrorStack?: boolean;
  // Additional arguments ('payload' is reserved for jwt payload!):
  args?: Record<string, unknown>;
};

type Verify = ReturnType<typeof verifyJwt>;
export type AuthInput = {
  verification: VerifyInput;
  methods: (keyof Methods)[] | RegExp;
  options?: VerifyOptions;
};
export type VerifyInput = CryptoKeyOrUpdateInput | Verify;
export type AuthInputAndVerify = Omit<AuthInput, "verification"> & {
  verify: Verify;
};

export function respond(
  methods: Methods,
  options: Options = {},
  authInput?: AuthInput,
) {
  const verify = authInput
    ? typeof authInput.verification === "function"
      ? authInput.verification
      : verifyJwt(authInput.verification)
    : undefined;
  return async (request: Request): Promise<Response> => {
    const authData = authInput && verify
      ? { ...authInput, verify, headers: request.headers }
      : undefined;
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
