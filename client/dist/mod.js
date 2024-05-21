// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const RANDOM_LEN = 16;
function replaceCharAt(str, index, __char) {
    return str.substring(0, index) + __char + str.substring(index + 1);
}
function encodeTime(now, len = 10) {
    if (!Number.isInteger(now) || now < 0 || now > TIME_MAX) {
        throw new Error("Time must be a positive integer less than " + TIME_MAX);
    }
    let str = "";
    for(; len > 0; len--){
        const mod = now % ENCODING_LEN;
        str = ENCODING[mod] + str;
        now = (now - mod) / ENCODING_LEN;
    }
    return str;
}
function encodeRandom(len) {
    let str = "";
    const randomBytes = crypto.getRandomValues(new Uint8Array(len));
    for (const randomByte of randomBytes){
        str += ENCODING[randomByte % ENCODING_LEN];
    }
    return str;
}
function incrementBase32(str) {
    let index = str.length;
    let __char;
    let charIndex;
    const maxCharIndex = ENCODING_LEN - 1;
    while(--index >= 0){
        __char = str[index];
        charIndex = ENCODING.indexOf(__char);
        if (charIndex === -1) {
            throw new Error("incorrectly encoded string");
        }
        if (charIndex === maxCharIndex) {
            str = replaceCharAt(str, index, ENCODING[0]);
            continue;
        }
        return replaceCharAt(str, index, ENCODING[charIndex + 1]);
    }
    throw new Error("cannot increment this string");
}
function monotonicFactory(encodeRand = encodeRandom) {
    let lastTime = 0;
    let lastRandom;
    return function ulid(seedTime = Date.now()) {
        if (seedTime <= lastTime) {
            const incrementedRandom = lastRandom = incrementBase32(lastRandom);
            return encodeTime(lastTime, 10) + incrementedRandom;
        }
        lastTime = seedTime;
        const newRandom = lastRandom = encodeRand(RANDOM_LEN);
        return encodeTime(seedTime, 10) + newRandom;
    };
}
monotonicFactory();
function ulid(seedTime = Date.now()) {
    return encodeTime(seedTime, 10) + encodeRandom(16);
}
function createRequest({ method, params, isNotification = false, id }) {
    const rpcRequest = {
        jsonrpc: "2.0",
        method
    };
    params && (rpcRequest.params = params);
    id = isNotification ? undefined : id !== undefined ? id : ulid();
    id !== undefined && (rpcRequest.id = id);
    return rpcRequest;
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
    if (isNotification) {
        if (data === undefined) {
            return data;
        } else {
            return {
                jsonrpc: "2.0",
                error: {
                    code: 0,
                    message: "The notification contains unexpected data."
                },
                id: null
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
            message: "Invalid JSON-RPC 2.0 response."
        },
        id: null
    };
}
function createFetchRequest(resource, body, options = {}) {
    const headers = options.headers ? options.headers : new Headers();
    if (options.jwt) {
        headers.set("Authorization", `Bearer ${options.jwt}`);
    }
    const request = new Request(resource, {
        headers,
        body,
        method: "POST"
    });
    const contentType = request.headers.get("Content-Type") || "";
    if (body instanceof FormData) {
        if (!contentType.startsWith("multipart/form-data")) {
            throw new Error("Invalid Content-Type header. The client must set it automatically.");
        }
    } else {
        if (!contentType.startsWith("application/json")) {
            request.headers.set("Content-Type", "application/json");
        }
    }
    return request;
}
async function fetchResponse(request) {
    try {
        const response = await fetch(request);
        if (!response.ok) {
            throw new Error(`Received HTTP status code ${response.status} (${response.statusText}).`);
        }
        const text = await response.text();
        return text === "" ? undefined : JSON.parse(text);
    } catch (error) {
        return {
            jsonrpc: "2.0",
            error: {
                code: 0,
                message: error.message
            },
            id: null
        };
    }
}
function makeRpcCall(resource) {
    return async (rpcRequestInput, options = {})=>{
        const isNotification = options.isNotification;
        const rpcResponse = validateResponse(await fetchResponse(createFetchRequest(resource, JSON.stringify(createRequest({
            ...rpcRequestInput,
            isNotification
        })), options)), options.isNotification);
        if (rpcResponse === undefined) {
            return rpcResponse;
        } else if (validateRpcSuccess(rpcResponse)) {
            return rpcResponse.result;
        } else {
            throw rpcResponse.error;
        }
    };
}
function makeBatchRpcCall(resource) {
    return async (rpcBatchRequestInput, options = {})=>{
        const isNotification = options.isNotification;
        const rpcBatchResponse = await fetchResponse(createFetchRequest(resource, JSON.stringify(rpcBatchRequestInput.map((rpcRequestInput)=>createRequest({
                ...rpcRequestInput,
                isNotification
            }))), options));
        if (isNotification) {
            if (rpcBatchResponse === undefined) {
                return rpcBatchResponse;
            } else {
                return [
                    {
                        jsonrpc: "2.0",
                        error: {
                            code: 0,
                            message: "The batch of notifications contain unexpected data."
                        },
                        id: null
                    }
                ];
            }
        } else if (Array.isArray(rpcBatchResponse) && rpcBatchResponse.length > 0) {
            const validatedRpcBatchResponse = rpcBatchResponse.map((rpcResponse)=>validateResponse(rpcResponse, isNotification));
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
                        code: 0,
                        message: "Invalid JSON-RPC 2.0 batch response."
                    },
                    id: null
                }
            ];
        }
    };
}
function makeRpcCallWithFormData(resource) {
    return async (rpcRequestInput, files, options = {})=>{
        const isNotification = options.isNotification;
        const formData = new FormData();
        const rpcRequest = createRequest({
            ...rpcRequestInput,
            isNotification
        });
        formData.append("rpc", JSON.stringify(rpcRequest));
        for (const [key, file] of Object.entries(files)){
            formData.append(key, file);
        }
        const rpcResponse = validateResponse(await fetchResponse(createFetchRequest(resource, formData, options)), options.isNotification);
        if (rpcResponse === undefined) {
            return rpcResponse;
        } else if (validateRpcSuccess(rpcResponse)) {
            return rpcResponse.result;
        } else {
            throw rpcResponse.error;
        }
    };
}
export { createFetchRequest as createFetchRequest };
export { makeRpcCall as makeRpcCall };
export { makeBatchRpcCall as makeBatchRpcCall };
export { makeRpcCallWithFormData as makeRpcCallWithFormData };

