import { isArray, isDefined, isFunction, isString } from "./deps.ts";
import { callMethodInWorker, isMethodObjectWithWorkerUrl } from "./worker.ts";
import { internalErrorData, validationErrorData } from "./error_data.ts";
import { CustomError } from "./custom_error.ts";
import { type AuthData, verifyJwtForSelectedMethods } from "./auth.ts";
import {
  type JsonObject,
  type RpcBatchResponse,
  type RpcResponse,
} from "../types.ts";
import { validateInput, type ValidationObject } from "./validation.ts";
import { type Options } from "./response.ts";
import { type Methods } from "./method.ts";

export type CreationInput = {
  validationObject: ValidationObject;
  methods: Methods;
  options: Options;
};
export type RpcResponseOrBatchOrNull =
  | RpcResponse
  | RpcBatchResponse
  | null;
type RpcResponseOrNull = RpcResponse | null;
type RpcBatchResponseOrNull = RpcBatchResponse | null;

export async function executeMethods(
  { validationObject, methods, options, payload }: CreationInput & {
    payload?: JsonObject;
  },
): Promise<ValidationObject> {
  if (validationObject.isError) return validationObject;
  try {
    const params = validationObject.params;
    const additionalArgument = payload
      ? { ...options.args, payload }
      : { ...options.args };
    const methodOrObject = methods[validationObject.method];
    const { method, validation } = isFunction(methodOrObject)
      ? { method: methodOrObject, validation: null }
      : methodOrObject;
    if (validation) {
      const { error } = validateInput(validation)(params);
      if (error) {
        return {
          id: validationObject.id,
          data: error,
          isError: true,
          ...validationErrorData,
        };
      }
    }
    const result = isMethodObjectWithWorkerUrl(methodOrObject)
      ? await callMethodInWorker({
        workerUrl: methodOrObject.workerUrl,
        method,
        params,
        options: { ...options, args: additionalArgument },
      })
      : Object.keys(additionalArgument).length === 0
      ? await method(params)
      : await method(params, additionalArgument);
    return {
      ...validationObject,
      result,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      return {
        code: error.code,
        message: error.message,
        id: validationObject.id,
        data: isDefined(error.data)
          ? error.data
          : options.publicErrorStack
          ? error.stack
          : undefined,
        isError: true,
      };
    }
    return {
      id: validationObject.id,
      data: options.publicErrorStack
        ? isString(error.stack) ? error.stack : "non-error thrown"
        : undefined,
      isError: true,
      ...internalErrorData,
    };
  }
}

async function createRpcResponse(
  { validationObject, methods, options, payload }: CreationInput & {
    payload?: JsonObject;
  },
): Promise<RpcResponseOrNull> {
  const obj: ValidationObject = await executeMethods(
    {
      validationObject,
      payload,
      methods,
      options,
    },
  );
  if ("result" in obj && obj.id !== undefined) {
    return {
      jsonrpc: "2.0",
      // `result` must be a JSON value
      result: obj.result === undefined ? null : obj.result,
      id: obj.id,
    };
  } else if (obj.isError && obj.id !== undefined) {
    return {
      jsonrpc: "2.0",
      error: {
        code: obj.code,
        message: obj.message,
        data: obj.data,
      },
      id: obj.id,
    };
  } else {
    return null;
  }
}

export async function createRpcResponseOrBatch(
  validationObjectOrBatch: ValidationObject | ValidationObject[],
  methods: Methods,
  options: Options,
  authDataArray?: AuthData[],
): Promise<RpcResponseOrBatchOrNull> {
  return isArray(validationObjectOrBatch)
    ? await cleanBatch(
      validationObjectOrBatch.map(async (validationObject) =>
        createRpcResponse(
          await verifyJwtForSelectedMethods({
            validationObject,
            methods,
            options,
            authDataArray,
          }),
        )
      ),
    )
    : await createRpcResponse(
      await verifyJwtForSelectedMethods({
        validationObject: validationObjectOrBatch,
        methods,
        options,
        authDataArray,
      }),
    );
}

async function cleanBatch(
  batch: Promise<RpcResponseOrNull>[],
): Promise<RpcBatchResponseOrNull> {
  const batchResponse = (await Promise.all(batch)).filter((
    obj: RpcResponseOrNull,
  ): obj is RpcResponse => obj !== null);
  return batchResponse.length > 0 ? batchResponse : null;
}
