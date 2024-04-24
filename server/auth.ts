import { authErrorData } from "./error_data.ts";
import { getJwtFromBearer, type Payload } from "./deps.ts";
import { type CreationInput } from "./creation.ts";
import { type AuthInputAndVerify } from "./response.ts";

export type AuthData = AuthInputAndVerify & { headers: Headers };

export async function verifyJwtForSelectedMethods(
  { validationObject, methods, options, authData }: CreationInput & {
    authData?: AuthData;
  },
): Promise<CreationInput & { payload?: Payload }> {
  if (validationObject.isError) return { validationObject, methods, options };
  if (authData) {
    const authMethods = authData.methods;
    if (
      Array.isArray(authMethods)
        ? authMethods.includes(validationObject.method)
        : authMethods?.test(validationObject.method)
    ) {
      try {
        const jwt = getJwtFromBearer(authData.headers);
        const payload = await authData.verify(jwt, authData.options);
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
