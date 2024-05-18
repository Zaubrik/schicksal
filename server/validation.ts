import { isFunction, isNotNull, isObject, isString } from "./deps.ts";
import {
  invalidParamsErrorData,
  invalidRequestErrorData,
  methodNotFoundErrorData,
  parseErrorData,
} from "./error_data.ts";
import { type Methods } from "./method.ts";
import {
  type JsonArray,
  type JsonObject,
  type JsonValue,
  type RpcId,
  type RpcMethod,
} from "../types.ts";

export type ValidationSuccess = {
  isError: false;
  id: RpcId;
  method: RpcMethod;
  params: JsonArray | JsonObject | undefined;
  result?: JsonValue;
};
export type ValidationFailure = {
  isError: true;
  id: RpcId;
  message: string;
  code: number;
  data?: JsonValue;
};
export type ValidationObject = ValidationSuccess | ValidationFailure;

function isRpcVersion(input: unknown): input is "2.0" {
  return input === "2.0";
}

function isRpcMethod(input: unknown): input is string {
  return isString(input) && !input.startsWith("rpc.");
}

export function isRpcParams(input: unknown): input is JsonArray | JsonObject {
  return typeof input === "object" && isNotNull(input);
}

function isRpcId(input: unknown): input is RpcId {
  switch (typeof input) {
    case "string":
      return true;
    case "number":
      return input % 1 === 0;
    case "object":
      return input === null;
    default:
      return false;
  }
}

function tryToParse(json: string) {
  try {
    return [JSON.parse(json), null];
  } catch {
    return [null, {
      id: null,
      isError: true,
      ...parseErrorData,
    }];
  }
}

export function validateRequest(
  body: string,
  methods: Methods,
): ValidationObject | ValidationObject[] {
  const [decodedBody, parsingError] = tryToParse(body);
  if (parsingError) return parsingError;
  if (Array.isArray(decodedBody) && decodedBody.length > 0) {
    return decodedBody.map((rpc) => validateRpcRequestObject(rpc, methods));
  } else {
    return validateRpcRequestObject(decodedBody, methods);
  }
}

export function validateRpcRequestObject(
  // deno-lint-ignore no-explicit-any
  decodedBody: any,
  methods: Methods,
): ValidationObject {
  if (isObject(decodedBody)) {
    if (
      !isRpcVersion(decodedBody.jsonrpc) ||
      !isRpcMethod(decodedBody.method) ||
      ("id" in decodedBody && !isRpcId(decodedBody.id))
    ) {
      return {
        code: -32600,
        message: "Invalid Request",
        id: isRpcId(decodedBody.id) ? decodedBody.id : null,
        isError: true,
      };
    } else if (
      !(isFunction(methods[decodedBody.method]) ||
        // deno-lint-ignore no-explicit-any
        isFunction((methods[decodedBody.method] as any)?.method))
    ) {
      return {
        id: decodedBody.id,
        isError: true,
        ...methodNotFoundErrorData,
      };
    } else if ("params" in decodedBody && !isRpcParams(decodedBody.params)) {
      return {
        id: decodedBody.id,
        isError: true,
        ...invalidParamsErrorData,
      };
    } else {
      return {
        id: decodedBody.id,
        method: decodedBody.method,
        params: decodedBody.params,
        isError: false,
      };
    }
  } else {
    return {
      id: null,
      isError: true,
      ...invalidRequestErrorData,
    };
  }
}
