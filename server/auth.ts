import { verify } from "./deps.ts";
import type { Payload } from "./deps.ts";
import type { CreationInput } from "./creation.ts";

export async function verifyJwt(
  { validationObject, methods, options, authHeader }: CreationInput & {
    authHeader: string | null;
  },
): Promise<CreationInput & { payload?: Payload }> {
  if (validationObject.isError) return { validationObject, methods, options };
  if (options.auth) {
    const methodsOrUndefined = options.auth.methods;
    if (
      (Array.isArray(methodsOrUndefined)
        ? methodsOrUndefined?.includes(validationObject.method)
        : methodsOrUndefined?.test(validationObject.method)) ||
      options.auth.allMethods
    ) {
      try {
        if (!(options.auth.key instanceof CryptoKey)) {
          throw new Error("Authentication requires a CryptoKey.");
        }
        if (
          !authHeader ||
          !authHeader.startsWith("Bearer ") ||
          authHeader.length <= 7
        ) {
          throw new Error("No Authorization Header, no Bearer or no token.");
        } else {
          const payload = await verify(
            authHeader.slice(7),
            options.auth.key,
            options.auth.options,
          );
          return { validationObject, methods, options, payload };
        }
      } catch (err) {
        return {
          validationObject: {
            code: -32020,
            message: "Server error",
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
