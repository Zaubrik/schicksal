import { isObject, isString, isUrl } from "./deps.ts";
import { type JsonValue, type RpcParams } from "../types.ts";
import { type Options } from "./response.ts";
import { type Method, type MethodsObject, type WorkerUrl } from "./method.ts";

export function callMethodInWorker(
  { workerUrl, method, params, options }: {
    workerUrl: WorkerUrl;
    method: Method;
    params: RpcParams | undefined;
    options: Options;
  },
): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    const newWorkerUrl = isString(workerUrl)
      ? new URL(workerUrl, import.meta.url)
      : workerUrl;

    // console.log("Resolved worker URL:", newWorkerUrl.href);
    const worker = new Worker(newWorkerUrl.href, {
      type: "module",
    });

    worker.onmessage = (event) => {
      // console.log("Received message from worker:", event);
      const { result, error } = event.data;
      if (result) {
        resolve(result);
      } else if (error) {
        reject(error);
      }
      worker.terminate();
      event.preventDefault(); //cancel event error
    };

    worker.onerror = (event) => {
      // console.error("Worker encountered an error:", event);
      reject(new Error(event.message));
      worker.terminate();
      event.preventDefault();
    };

    worker.onmessageerror = (event) => {
      // console.error("Worker encountered a message error:", event);
      reject(event.data);
      worker.terminate();
      event.preventDefault();
    };
    const methodString = method.toString();
    worker.postMessage({
      methodString,
      params,
      args: options.args,
      workerLog: isUrl(options.workerLog)
        ? options.workerLog.href
        : options.workerLog,
    });
  });
}

export function isMethodObjectWithWorkerUrl(
  methodOrObject: Method | MethodsObject,
): methodOrObject is Required<MethodsObject> {
  return isObject(methodOrObject) && "workerUrl" in methodOrObject &&
    (isString(methodOrObject.workerUrl) || isUrl(methodOrObject.workerUrl));
}
