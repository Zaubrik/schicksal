export { type Payload, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

export {
  checkVersionAndVerify,
  type Options as VerifyOptions,
} from "../../portal/middlewares/auth.ts";
