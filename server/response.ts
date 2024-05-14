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

export function ensureVerify(authInput: AuthInput): AuthInput {
  const verification = authInput.verification;
  return {
    ...authInput,
    verification: typeof verification === "function"
      ? verification
      : verifyJwt(verification),
  };
}

export function respond(
  methods: Methods,
  options: Options = {},
  authInput: AuthInput | AuthInput[] = [],
) {
  const authInputArray = [authInput].flat();
  const authInputArrayIsNotEmpty = authInputArray.length > 0;
  const authInputAndVeryifyArray = authInputArray.map(ensureVerify);
  return async (request: Request): Promise<Response> => {
    const authData = authInputArrayIsNotEmpty
      ? authInputAndVeryifyArray.map((authInput) => ({
        ...authInput,
        headers: request.headers,
      }))
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
