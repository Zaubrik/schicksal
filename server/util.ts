import { v } from "./util_deps.ts";
import { type JsonArray, type JsonObject, type JsonValue } from "../types.ts";

export type StringOrNull = string | null;
export type NumberOrNull = number | null;

// Validators for JsonPrimitive
export const stringValidator = v.string();
export const numberValidator = v.number();
export const booleanValidator = v.boolean();
export const nullValidator = v.null();

// Validator for JsonPrimitive (union of all primitive types)
export const primitiveValidator = v.union(
  stringValidator,
  numberValidator,
  booleanValidator,
  nullValidator,
);

// Recursive validators for JsonValue, JsonObject, and JsonArray
export const valueValidator: v.Type<JsonValue> = v.lazy(() =>
  v.union(primitiveValidator, objectValidator, arrayValidator)
);
export const objectValidator: v.Type<JsonObject> = v.lazy(() =>
  v.record(valueValidator)
);
export const arrayValidator: v.Type<JsonArray> = v.lazy(() =>
  v.array(valueValidator)
);
export const stringOrNullValidator: v.Type<StringOrNull> = v.union(
  stringValidator,
  nullValidator,
);
export const numberOrNullValidator: v.Type<NumberOrNull> = v.union(
  numberValidator,
  nullValidator,
);

// Combination Validators for Arrays and Objects with specific types
export const stringArrayValidator = v.array(stringValidator);
export const numberArrayValidator = v.array(numberValidator);
export const booleanArrayValidator = v.array(booleanValidator);
export const objectArrayValidator = v.array(objectValidator);
export const stringOrNullArrayValidator = v.array(stringOrNullValidator);
export const numberOrNullArrayValidator = v.array(numberOrNullValidator);

export const stringObjectValidator = v.record(stringValidator);
export const numberObjectValidator = v.record(numberValidator);
export const booleanObjectValidator = v.record(booleanValidator);
export const objectObjectValidator = v.record(objectValidator);
export const stringOrNullObjectValidator = v.record(stringOrNullValidator);
export const numberOrNullObjectValidator = v.record(numberOrNullValidator);
