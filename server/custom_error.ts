import type { JsonValue } from "../rpc_types.ts";

export class CustomError extends Error {
  code: number;
  data: JsonValue | undefined;
  constructor(code: number, message: string, data?: JsonValue) {
    super(message);
    this.code = code;
    this.data = data;
  }
}
