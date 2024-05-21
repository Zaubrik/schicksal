import { JsonValue } from "../types.ts";
import {
  createRequest as createRpcRequest,
  type CreateRequestInput,
} from "./creation.ts";
import { validateResponse, validateRpcSuccess } from "./validation.ts";

type Resource = string | URL;
type CreateRequestOptions = { jwt?: string; headers?: Headers };

export function createFetchRequest(
  resource: Resource,
  body: BodyInit,
  options: CreateRequestOptions = {},
): Request {
  const headers = options.headers ? options.headers : new Headers();
  if (options.jwt) {
    headers.set("Authorization", `Bearer ${options.jwt}`);
  }
  const request = new Request(resource, { headers, body, method: "POST" });
  const contentType = request.headers.get("Content-Type") || "";
  if (body instanceof FormData) {
    if (!contentType.startsWith("multipart/form-data")) {
      throw new Error(
        "Invalid Content-Type header. The client must set it automatically.",
      );
    }
  } else {
    if (!contentType.startsWith("application/json")) {
      request.headers.set("Content-Type", "application/json");
    }
  }
  return request;
}

async function fetchResponse(
  request: Request,
): Promise<JsonValue | undefined> {
  try {
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(
        `Received HTTP status code ${response.status} (${response.statusText}).`,
      );
    }
    const text = await response.text();
    return text === "" ? undefined : JSON.parse(text);
  } catch (error) {
    return {
      jsonrpc: "2.0",
      error: {
        code: 0,
        message: error.message,
      },
      id: null,
    };
  }
}

type MakeRpcCallOrNotificationOptions = CreateRequestOptions & {
  isNotification?: boolean;
};
type MakeRpcCallOptions = CreateRequestOptions & {
  isNotification?: false;
};
type MakeRpcNotificationOptions = CreateRequestOptions & {
  isNotification: true;
};

type MakeRpcCallInnerFunction = {
  (
    rpcRequestInput: CreateRequestInput,
    options: MakeRpcNotificationOptions,
  ): Promise<undefined>;
  (
    rpcRequestInput: CreateRequestInput,
    options?: MakeRpcCallOptions,
  ): Promise<JsonValue>;
  (
    rpcRequestInput: CreateRequestInput,
    options: MakeRpcCallOrNotificationOptions,
  ): Promise<JsonValue | undefined>;
};

// Adding `hasRpcResponseBasis` would change the return type and is not
// necessary because it only makes sense for batch rpc calls.
export function makeRpcCall(resource: Resource): MakeRpcCallInnerFunction {
  // deno-lint-ignore no-explicit-any
  return async (rpcRequestInput, options = {}): Promise<any> => {
    const isNotification = options.isNotification;
    const rpcResponse = validateResponse(
      await fetchResponse(
        createFetchRequest(
          resource,
          JSON.stringify(
            createRpcRequest({ ...rpcRequestInput, isNotification }),
          ),
          options,
        ),
      ),
      options.isNotification,
    );
    if (rpcResponse === undefined) {
      return rpcResponse;
    } else if (validateRpcSuccess(rpcResponse)) {
      return rpcResponse.result;
    } else {
      throw rpcResponse.error;
    }
  };
}

type MakeBatchRpcCallOrNotificationOptions = CreateRequestOptions & {
  isNotification?: boolean;
  hasRpcResponseBasis?: boolean;
};

export function makeBatchRpcCall(resource: Resource) {
  return async (
    rpcBatchRequestInput: CreateRequestInput[],
    options: MakeBatchRpcCallOrNotificationOptions = {},
  ) => {
    const isNotification = options.isNotification;
    const rpcBatchResponse = await fetchResponse(
      createFetchRequest(
        resource,
        JSON.stringify(
          rpcBatchRequestInput.map((rpcRequestInput) =>
            createRpcRequest({ ...rpcRequestInput, isNotification })
          ),
        ),
        options,
      ),
    );
    if (isNotification) {
      if (rpcBatchResponse === undefined) {
        return rpcBatchResponse;
      } else {
        return [{
          jsonrpc: "2.0",
          error: {
            code: 0,
            message: "The batch of notifications contain unexpected data.",
          },
          id: null,
        }];
      }
    } else if (
      Array.isArray(rpcBatchResponse) && rpcBatchResponse.length > 0
    ) {
      const validatedRpcBatchResponse = rpcBatchResponse.map((rpcResponse) =>
        validateResponse(rpcResponse, isNotification)
      );
      if (options.hasRpcResponseBasis) {
        return validatedRpcBatchResponse;
      } else {
        return validatedRpcBatchResponse.map((rpcResponse) =>
          validateRpcSuccess(rpcResponse)
            ? rpcResponse.result
            : rpcResponse!.error
        );
      }
    } else {
      return [{
        jsonrpc: "2.0",
        error: {
          code: 0,
          message: "Invalid JSON-RPC 2.0 batch response.",
        },
        id: null,
      }];
    }
  };
}

export function makeRpcCallWithFormData(resource: Resource) {
  return async (
    rpcRequestInput: CreateRequestInput,
    files: Record<string, Blob>,
    options: MakeRpcCallOrNotificationOptions = {},
    // deno-lint-ignore no-explicit-any
  ): Promise<any> => {
    const isNotification = options.isNotification;

    const formData = new FormData();
    const rpcRequest = createRpcRequest({ ...rpcRequestInput, isNotification });
    formData.append("rpc", JSON.stringify(rpcRequest));
    for (const [key, file] of Object.entries(files)) {
      formData.append(key, file);
    }
    const rpcResponse = validateResponse(
      await fetchResponse(
        createFetchRequest(
          resource,
          formData,
          options,
        ),
      ),
      options.isNotification,
    );

    if (rpcResponse === undefined) {
      return rpcResponse;
    } else if (validateRpcSuccess(rpcResponse)) {
      return rpcResponse.result;
    } else {
      throw rpcResponse.error;
    }
  };
}
