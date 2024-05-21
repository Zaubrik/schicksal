import { type Type } from "./deps.ts";
import { type JsonValue } from "../types.ts";

export type WorkerUrl = string | URL;
// deno-lint-ignore no-explicit-any
export type Method = (...args: any[]) => JsonValue | Promise<JsonValue>;
export type MethodsObject = {
  method: Method;
  // deno-lint-ignore no-explicit-any
  validation?: Type<any>;
  workerUrl?: WorkerUrl;
};
export type Methods = {
  [method: string]: Method | MethodsObject;
};
