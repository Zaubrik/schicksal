export const internalErrorData = { code: -32603, message: "Internal error" };
export const parseErrorData = { code: -32700, message: "Parse error" };
export const methodNotFoundErrorData = {
  code: -32601,
  message: "Method not found",
};
export const invalidParamsErrorData = {
  code: -32602,
  message: "Invalid params",
};
export const invalidRequestErrorData = {
  code: -32600,
  message: "Invalid Request",
};

/**
 * -32000 to -32099 Reserved for implementation-defined server-errors.
 */
export const authErrorData = { code: -32020, message: "Failed authorization" };
export const validationErrorData = {
  code: -32030,
  message: "Failed params validation",
};
export const formDataErrorData = {
  code: -32040,
  message: "Invalid formData object",
};
