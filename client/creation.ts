import { RpcRequest } from "./rpc_types.ts";

export type CreateRequestInput = {
  method: string;
  params?: RpcRequest["params"];
  isNotification?: boolean;
  id?: RpcRequest["id"];
};

export function createRequest(
  { method, params, isNotification = false, id }: CreateRequestInput,
): RpcRequest {
  const rpcRequest: RpcRequest = {
    jsonrpc: "2.0",
    method,
  };
  params && (rpcRequest.params = params);
  id = isNotification ? undefined : id !== undefined ? id : generateId();
  id !== undefined && (rpcRequest.id = id);
  return rpcRequest;
}

function generateId() {
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
}
