import {
  type CryptoKeyOrUpdateInput,
  isFunction,
  verifyJwt,
  type VerifyOptions,
} from "./deps.ts";
import { createRpcResponseOrBatch } from "./creation.ts";
import { validateRequest } from "./validation.ts";
import { type Methods } from "./method.ts";
import { formDataErrorData } from "./error_data.ts";

export type Options = {
  // Add response headers:
  headers?: Headers;
  // Include server side error messages in response (default: false):
  publicErrorStack?: boolean;
  // Accepts a FormData object inside the request's body (default: false):
  acceptFormData?: boolean;
  // Additional arguments ('payload' and 'blobs' are reserved.):
  args?: Record<string, unknown>;
  // Filepath for worker logs:
  workerLog?: string | URL;
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
    verification: isFunction(verification)
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
  const handleFormData = respondByHandlingFormData(methods, options, authInput);
  return async (request: Request): Promise<Response> => {
    if (options.acceptFormData) {
      return await handleFormData(request);
    }
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

export function respondByHandlingFormData(
  methods: Methods,
  options: Options = {},
  authInput: AuthInput | AuthInput[] = [],
) {
  return async (request: Request): Promise<Response> => {
    const headers = options.headers ?? new Headers();
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      try {
        const formData = await request.formData();
        const rpcRequestString = formData.get("rpc")?.toString();
        if (rpcRequestString) {
          const newRequest = createNewRpcRequest(request, rpcRequestString);
          const blobs: Record<string, Blob> = {};
          formData.forEach((value, key) => {
            if (key !== "rpc") {
              blobs[key] = value as Blob;
            }
          });
          const updatedOptions = {
            ...options,
            acceptFormData: false,
            args: { ...options.args, blobs },
          };
          return await respond(methods, updatedOptions, authInput)(
            newRequest,
          );
        } else {
          throw new Error();
        }
      } catch {
        headers.append("content-type", "application/json");
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              ...formDataErrorData,
            },
            id: null,
          }),
          {
            status: 200,
            headers,
          },
        );
      }
    } else {
      return await respond(
        methods,
        { ...options, acceptFormData: false },
        authInput,
      )(
        request,
      );
    }
  };
}

function createNewRpcRequest(
  request: Request,
  rpcRequestString: string,
): Request {
  const options = {
    method: request.method,
    headers: new Headers(request.headers),
    body: rpcRequestString,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    integrity: request.integrity,
  };
  options.headers.append("content-type", "application/json");
  return new Request(request.url, options);
}
