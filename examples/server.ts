import { ensureSymlinkedDataDirectorySync } from "./deps.ts";
import { respond } from "../server/mod.ts";
import { add, animalsMakeNoise, makeName } from "./methods.ts";
import { numberArrayValidator } from "../helpers/server/validation.ts";

export const methods = {
  add: {
    method: add,
    validation: numberArrayValidator,
    workerUrl: "./workers/call.ts",
  },
  makeName: makeName,
  animalsMakeNoise: animalsMakeNoise,
};
const options = {
  publicErrorStack: true,
  workerLog: ensureSymlinkedDataDirectorySync("server.localhost") +
    "/worker.log",
  args: { text: "My name is" },
};

Deno.serve(respond(methods, options));
