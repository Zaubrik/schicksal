import { type Payload, verify } from "./deps.ts";
import type { CreationInput } from "./creation.ts";

export const authErrorCode = -32020;

function getJwtFromBearer(headers: Headers): string {
  const authHeader = headers.get("Authorization");
  if (authHeader === null) {
    throw new Error("No 'Authorization' header.");
  } else if (!authHeader.startsWith("Bearer ") || authHeader.length <= 7) {
    throw new Error("Invalid 'Authorization' header.");
  } else {
    return authHeader.slice(7);
  }
}

export async function verifyJwt(
  { validationObject, methods, options, headers }: CreationInput & {
    headers: Headers;
  },
): Promise<CreationInput & { payload?: Payload }> {
  if (validationObject.isError) return { validationObject, methods, options };
  if (options.auth) {
    const methodsOrUndefined = options.auth.methods;
    if (
      Array.isArray(methodsOrUndefined)
        ? methodsOrUndefined?.includes(validationObject.method)
        : methodsOrUndefined?.test(validationObject.method)
    ) {
      try {
        if (!(options.auth.key instanceof CryptoKey)) {
          throw new Error("Authentication requires a CryptoKey.");
        }
        const jwt = getJwtFromBearer(headers);
        const payload = await verify(
          jwt,
          options.auth.key,
          options.auth.options,
        );
        return { validationObject, methods, options, payload };
      } catch (err) {
        return {
          validationObject: {
            code: authErrorCode,
            message: "Authorization error",
            id: validationObject.id,
            data: options.publicErrorStack ? err.stack : undefined,
            isError: true,
          },
          methods,
          options,
        };
      }
    }
  }
  return { validationObject, methods, options };
}
