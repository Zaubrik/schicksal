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
  // enable 'subscribe', 'emit' and 'unsubscribe' (only ws):
  enableInternalMethods?: boolean;
  // for jwt verification:
  auth?: {
    key?: CryptoKey;
    methods?: (keyof Methods)[];
    allMethods?: boolean;
    jwt?: string | null;
  };
};

export async function respond(
  methods: Methods,
  req: Request,
  {
    headers = new Headers(),
    publicErrorStack = false,
    enableInternalMethods = false,
    auth = {},
  }: Options = {},
): Promise<Response> {
  return await handleHttpRequest(
    req,
    methods,
    {
      headers,
      publicErrorStack,
      enableInternalMethods,
      auth,
    },
    req.headers.get("Authorization"),
  );
}
