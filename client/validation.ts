import type {
  RpcFailure,
  RpcResponse,
  RpcResponseBasis,
  RpcSuccess,
} from "../rpc_types.ts";

// deno-lint-ignore no-explicit-any
function validateRpcBasis(data: any): data is RpcResponseBasis {
  return (
    data?.jsonrpc === "2.0" &&
    (typeof data.id === "number" ||
      typeof data.id === "string" ||
      data.id === null)
  );
}

// deno-lint-ignore no-explicit-any
export function validateRpcSuccess(data: any): data is RpcSuccess {
  return "result" in data;
}

// deno-lint-ignore no-explicit-any
function validateRpcFailure(data: any): data is RpcFailure {
  return (
    typeof data?.error?.code === "number" &&
    typeof data.error.message === "string"
  );
}

export function validateResponse(
  data: unknown,
  isNotification?: boolean,
): RpcResponse | undefined {
  if (isNotification) {
    if (data === undefined) {
      return data;
    } else {
      return {
        jsonrpc: "2.0",
        error: {
          code: 0,
          message: "The notification contains unexpected data.",
        },
        id: null,
      };
    }
  }
  if (validateRpcBasis(data)) {
    if (validateRpcSuccess(data)) {
      return data;
    } else if (validateRpcFailure(data)) {
      return data;
    }
  }
  return {
    jsonrpc: "2.0",
    error: {
      code: 0,
      message: "Invalid JSON-RPC 2.0 response.",
    },
    id: null,
  };
}
