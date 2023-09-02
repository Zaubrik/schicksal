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
type AuthMethodsAndOptions = {
  methods: (keyof Methods)[] | RegExp;
  options?: VerifyOptions;
};
export type AuthInput = AuthMethodsAndOptions & { verify: Verify };

export function respond(
  methods: Methods,
  options: Options = {},
  authInput?: AuthInput,
) {
  return async (request: Request): Promise<Response> => {
    const authData = authInput
      ? { ...authInput, headers: request.headers }
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

export function respondWithAuth(
  cryptoKeyOrUpdateInput: CryptoKeyOrUpdateInput,
) {
  const verify = verifyJwt(cryptoKeyOrUpdateInput);
  return (
    methods: Methods,
    authMethodsAndOptions: AuthMethodsAndOptions,
    options: Options = {},
  ) => respond(methods, options, { verify, ...authMethodsAndOptions });
}
