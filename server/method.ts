import { type JsonValue } from "../types.ts";
import { type Type } from "./deps.ts";

// deno-lint-ignore no-explicit-any
export type Method = (...args: any[]) => JsonValue | Promise<JsonValue>;
export type Methods = {
  [method: string]: Method | {
    method: Method;
    // deno-lint-ignore no-explicit-any
    validation: Type<any>;
  };
};
