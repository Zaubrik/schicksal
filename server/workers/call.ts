import { logTo } from "../deps.ts";

self.onmessage = async (event: MessageEvent) => {
  let errorOrNull = null;
  // console.log("Worker received message:", event.data);
  const { methodString, params, args, workerLog } = event.data;
  const logger = logTo(workerLog);
  try {
    self.onerror = async (event) => {
      const { type, filename, lineno, colno, message } = event as ErrorEvent;
      await logger.next(
        JSON.stringify({ type, filename, lineno, colno, error: message }),
      );
      self.postMessage({ error: message });
    };
    // console.log("Executing method:", methodString);
    // Reconstruct the function using eval
    const method = eval(`(${methodString})`);
    const result = Object.keys(args).length === 0
      ? await method(params)
      : await method(params, args);
    // console.log("Method execution completed. Result:", result);
    // Send the result back to the main thread
    self.postMessage({ result });
  } catch (error) {
    // console.error("Error during method execution:", error);
    errorOrNull = error;
    // Send the error back to the main thread
    self.postMessage({ error });
  } finally {
    // console.log("Worker terminating");
    await logger.next(
      JSON.stringify({
        type: event.type,
        data: event.data,
        error: errorOrNull?.message ?? null,
      }),
    );
    // Terminate the worker
    self.close();
  }
};
