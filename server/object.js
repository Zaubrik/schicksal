/**
 * isObject.
 * @param {unknown} input
 * @returns {input is Record<string, any>}
 */
export function isObject(input) {
  return (
    input !== null && typeof input === "object" &&
    Array.isArray(input) === false
  );
}
