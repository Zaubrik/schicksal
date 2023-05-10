import { JsonValue, RpcBatchRequest, RpcRequest } from "../rpc_types.ts";
import {
  createRequest as createRpcRequest,
  type CreateRequestInput,
} from "./creation.ts";
import { validateResponse, validateRpcSuccess } from "./validation.ts";

type Resource = string | URL;
type CreateRequestOptions = { jwt?: string; headers?: Headers };

function createFetchRequest(
  resource: Resource,
  rpcRequestOrBatch: RpcRequest | RpcBatchRequest,
  options: CreateRequestOptions = {},
): Request {
  const headers = options.headers ? options.headers : new Headers();
  headers.set("Content-Type", "application/json");
  if (options.jwt) {
    headers.set("Authorization", `Bearer ${options.jwt}`);
  }
  return new Request(resource, {
    headers,
    body: JSON.stringify(rpcRequestOrBatch),
    method: "POST",
  });
}

async function fetchResponse(
  request: Request,
): Promise<JsonValue | undefined> {
  const response = await fetch(request);
  const text = await response.text();
  return text === "" ? undefined : JSON.parse(text);
}

type MakeRpcCallOptions = CreateRequestOptions & {
  isNotification?: boolean;
  hasRpcResponseBasis?: boolean;
};

export function makeRpcCall(resource: Resource) {
  return async (
    rpcRequestInput: CreateRequestInput,
    options: MakeRpcCallOptions = {},
  ) => {
    const rpcResponse = validateResponse(
      await fetchResponse(
        createFetchRequest(
          resource,
          createRpcRequest(rpcRequestInput),
          options,
        ),
      ),
      options.isNotification,
    );

    if (options.hasRpcResponseBasis) {
      return rpcResponse;
    }

    if (validateRpcSuccess(rpcResponse)) {
      return rpcResponse.result;
    } else {
      throw rpcResponse.error;
    }
  };
}

export function makeBatchRpcCall(resource: Resource) {
  return async (
    rpcBatchRequestInput: CreateRequestInput[],
    options: MakeRpcCallOptions = {},
  ) => {
    const rpcBatchResponse = await fetchResponse(
      createFetchRequest(
        resource,
        rpcBatchRequestInput.map(createRpcRequest),
        options,
      ),
    );
    if (rpcBatchResponse === undefined && options.isNotification) {
      return rpcBatchResponse;
    } else if (
      Array.isArray(rpcBatchResponse) && rpcBatchResponse.length > 0
    ) {
      const validatedRpcBatchResponse = rpcBatchResponse.map((rpcResponse) =>
        validateResponse(rpcResponse, options.isNotification)
      );
      if (options.hasRpcResponseBasis) {
        return validatedRpcBatchResponse;
      } else {
        return validatedRpcBatchResponse.map((rpcResponse) =>
          validateRpcSuccess(rpcResponse)
            ? rpcResponse.result
            : rpcResponse.error
        );
      }
    } else {
      return [{
        jsonrpc: "2.0",
        error: {
          code: -32092,
          message: "Invalid JSON-RPC 2.0 batch response.",
        },
        id: null,
      }];
    }
  };
}
