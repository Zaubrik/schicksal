import { authErrorData } from "./error_data.ts";
import { getJwtFromBearer, type Payload } from "./deps.ts";
import { type CreationInput } from "./creation.ts";
import { type AuthData } from "./response.ts";

export async function verifyJwtForSelectedMethods(
  { validationObject, methods, options, authData }: CreationInput & {
    authData: AuthData;
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
        const jwt = getJwtFromBearer(authData.headers);
        const payload = await (await authData.verify!)(jwt);
        return { validationObject, methods, options, payload };
      } catch (err) {
        return {
          validationObject: {
            id: validationObject.id,
            data: options.publicErrorStack ? err.stack : undefined,
            isError: true,
            ...authErrorData,
          },
          methods,
          options,
        };
      }
    }
  }
  return { validationObject, methods, options };
}
