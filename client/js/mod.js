// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function createRequest({ method , params , isNotification =false , id  }) {
    const rpcRequest = {
        jsonrpc: "2.0",
        method
    };
    params && (rpcRequest.params = params);
    id = isNotification ? undefined : id !== undefined ? id : generateId();
    id !== undefined && (rpcRequest.id = id);
    return rpcRequest;
}
function generateId() {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
}
function validateRpcBasis(data) {
    return data?.jsonrpc === "2.0" && (typeof data.id === "number" || typeof data.id === "string" || data.id === null);
}
function validateRpcSuccess(data) {
    return "result" in data;
}
function validateRpcFailure(data) {
    return typeof data?.error?.code === "number" && typeof data.error.message === "string";
}
function validateResponse(data, isNotification) {
    if (isNotification && data !== undefined) {
        return {
            jsonrpc: "2.0",
            error: {
                code: -32091,
                message: "The notification contains unexpected data."
            },
            id: null
        };
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
            code: -32090,
            message: "Invalid JSON-RPC 2.0 response."
        },
        id: null
    };
}
function createFetchRequest(resource, rpcRequestOrBatch, options = {}) {
    const headers = options.headers ? options.headers : new Headers();
    headers.set("Content-Type", "application/json");
    if (options.jwt) {
        headers.set("Authorization", `Bearer ${options.jwt}`);
    }
    return new Request(resource, {
        headers,
        body: JSON.stringify(rpcRequestOrBatch),
        method: "POST"
    });
}
async function fetchResponse(request) {
    const response = await fetch(request);
    const text = await response.text();
    return text === "" ? undefined : JSON.parse(text);
}
function makeRpcCall(resource) {
    return async (rpcRequestInput, options = {})=>{
        const rpcResponse = validateResponse(await fetchResponse(createFetchRequest(resource, createRequest(rpcRequestInput), options)), options.isNotification);
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
function makeBatchRpcCall(resource) {
    return async (rpcBatchRequestInput, options = {})=>{
        const rpcBatchResponse = await fetchResponse(createFetchRequest(resource, rpcBatchRequestInput.map(createRequest), options));
        if (rpcBatchResponse === undefined && options.isNotification) {
            return rpcBatchResponse;
        } else if (Array.isArray(rpcBatchResponse) && rpcBatchResponse.length > 0) {
            const validatedRpcBatchResponse = rpcBatchResponse.map((rpcResponse)=>validateResponse(rpcResponse, options.isNotification));
            if (options.hasRpcResponseBasis) {
                return validatedRpcBatchResponse;
            } else {
                return validatedRpcBatchResponse.map((rpcResponse)=>validateRpcSuccess(rpcResponse) ? rpcResponse.result : rpcResponse.error);
            }
        } else {
            return [
                {
                    jsonrpc: "2.0",
                    error: {
                        code: -32092,
                        message: "Invalid JSON-RPC 2.0 batch response."
                    },
                    id: null
                }
            ];
        }
    };
}
export { makeRpcCall as makeRpcCall };
export { makeBatchRpcCall as makeBatchRpcCall };

