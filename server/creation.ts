import { internalErrorData } from "./error_data.ts";
import { CustomError } from "./custom_error.ts";
import { verifyJwtForSelectedMethods } from "./auth.ts";
import { type RpcBatchResponse, type RpcResponse } from "../rpc_types.ts";
import { type ValidationObject } from "./validation.ts";
import { type AuthData, type Methods, type Options } from "./response.ts";
import { type Payload } from "./deps.ts";

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

async function executeMethods(
  { validationObject, methods, options, payload }: CreationInput & {
    payload?: Payload;
  },
): Promise<ValidationObject> {
  if (validationObject.isError) return validationObject;
  try {
    const additionalArgument = { ...options.args, payload };
    const method = methods[validationObject.method];
    return {
      ...validationObject,
      result: Object.keys(additionalArgument).length === 0
        ? await method(validationObject.params)
        : await method(validationObject.params, additionalArgument),
    };
  } catch (error) {
    if (error instanceof CustomError) {
      return {
        code: error.code,
        message: error.message,
        id: validationObject.id,
        data: error.data,
        isError: true,
      };
    }
    return {
      id: validationObject.id,
      data: options.publicErrorStack ? error.stack : undefined,
      isError: true,
      ...internalErrorData,
    };
  }
}

async function createRpcResponse(
  { validationObject, methods, options, payload }: CreationInput & {
    payload?: Payload;
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
  authData: AuthData,
): Promise<RpcResponseOrBatchOrNull> {
  return Array.isArray(validationObjectOrBatch)
    ? await cleanBatch(
      validationObjectOrBatch.map(async (validationObject) =>
        createRpcResponse(
          await verifyJwtForSelectedMethods({
            validationObject,
            methods,
            options,
            authData,
          }),
        )
      ),
    )
    : await createRpcResponse(
      await verifyJwtForSelectedMethods({
        validationObject: validationObjectOrBatch,
        methods,
        options,
        authData,
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
