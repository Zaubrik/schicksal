import { handleHttpRequest } from "./http.ts";
import type { JsonValue } from "../rpc_types.ts";

export type Methods = {
  [method: string]: (...arg: any[]) => JsonValue | Promise<JsonValue>;
};
export type Options = {
  // Add headers to the default header '{"content-type" : "application/json"}':
  headers?: Headers;
  // include or don't include server side error messages in response:
  publicErrorStack?: boolean;
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
}: Options = {}) {
  return async (request: Request): Promise<Response> => {
    return await handleHttpRequest(
      request,
      methods,
      {
        headers,
        publicErrorStack,
        auth,
      },
      request.headers.get("Authorization"),
    );
  };
}
