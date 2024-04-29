import { authErrorData } from "./error_data.ts";
import { getJwtFromBearer, type Payload } from "./deps.ts";
import { type CreationInput } from "./creation.ts";
import { type AuthInputAndVerify } from "./response.ts";
import { type ValidationSuccess } from "./validation.ts";

export type AuthData = AuthInputAndVerify & { headers: Headers };
type VerifyJwtForSelectedMethodsReturnType = CreationInput & {
  payload?: Payload;
};

function isPresent<T>(input: T | undefined | null): input is T {
  return input !== undefined && input !== null;
}

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
      return errorOrUndefined as CreationInput & { payload?: Payload };
    } else if (authResults.length > 0) {
      return authResults[0] as CreationInput & { payload?: Payload };
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
    } else {
      return null;
    }
  };
}
