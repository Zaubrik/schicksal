import {
  Context,
  createHandler,
  createRoute,
  enableCors,
  fallBack,
  importMetaResolveFs,
  listen,
  logger,
  respond,
} from "./deps.ts";

const resolveModuleFs = importMetaResolveFs(import.meta.url);
const isDevelopment = true;

function add([a, b]: [number, number]) {
  return a + b;
}

function makeName(
  { firstName, lastName }: { firstName: string; lastName: string },
) {
  return `${firstName} ${lastName}`;
}

const methods = {
  add: add,
  makeName: makeName,
};

const routePost = createRoute("POST");
const route = routePost({ pathname: "*" });

const handler = createHandler(Context)(route)(fallBack)(
  await logger(
    resolveModuleFs("./log/access.log"),
    isDevelopment,
  ),
  enableCors({ allowedOrigins: "*" }),
);

await listen(handler)({ port: 8080 });
