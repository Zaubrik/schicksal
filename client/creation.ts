import { RpcRequest } from "../rpc_types.ts";
import { generateUlid } from "./deps.ts";

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
  id = isNotification ? undefined : id !== undefined ? id : generateUlid();
  id !== undefined && (rpcRequest.id = id);
  return rpcRequest;
}
