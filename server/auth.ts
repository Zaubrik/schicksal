import { authErrorData } from "./error_data.ts";
import { getJwtFromBearer, isArray, isFunction, isPresent } from "./deps.ts";
import { type JsonObject } from "../types.ts";
import { type CreationInput } from "./creation.ts";
import { type AuthInput } from "./response.ts";
import { type ValidationSuccess } from "./validation.ts";

export type AuthData = AuthInput & { headers: Headers };
type VerifyJwtForSelectedMethodsReturnType = CreationInput & {
  payload?: JsonObject;
};

export async function verifyJwtForSelectedMethods(
  { validationObject, methods, options, authDataArray }: CreationInput & {
    authDataArray?: AuthData[];
  },
): Promise<VerifyJwtForSelectedMethodsReturnType> {
  if (validationObject.isError) return { validationObject, methods, options };
  if (authDataArray) {
    const authResults = (await Promise.all(
      authDataArray.map(
        processAuthData({ validationObject, methods, options }),
      ),
    )).filter(isPresent);
    const errorOrUndefined = authResults.find((item) =>
      item.validationObject && item.validationObject.isError
    );
    if (errorOrUndefined) {
      return errorOrUndefined as CreationInput & { payload?: JsonObject };
    } else if (authResults.length > 0) {
      return authResults[0] as CreationInput & { payload?: JsonObject };
    }
  }
  return { validationObject, methods, options };
}

function processAuthData(
  { validationObject, methods, options }: {
    validationObject: ValidationSuccess;
    methods: CreationInput["methods"];
    options: CreationInput["options"];
  },
) {
  return async (authData: AuthData) => {
    const authMethods = authData.methods;
    if (
      isArray(authMethods)
        ? authMethods.includes(validationObject.method)
        : authMethods?.test(validationObject.method)
    ) {
      try {
        const verify = authData.verification;
        if (isFunction(verify)) {
          const jwt = getJwtFromBearer(authData.headers);
          const payload = await verify(jwt, authData.options);
          return { validationObject, methods, options, payload };
        } else {
          throw new Error(
            "There is no verify function. This error should never happen!",
          );
        }
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
    } else {
      return null;
    }
  };
}
