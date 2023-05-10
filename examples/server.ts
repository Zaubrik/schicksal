import {
  Context,
  createHandler,
  createRoute,
  enableCors,
  fallBack,
  importMetaResolveFs,
  listen,
  logger,
  respondRpc,
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

function animalsMakeNoise(noise: string[]) {
  return noise.map((el) => el.toUpperCase()).join(" ");
}

function return200(ctx: Context) {
  ctx.response = new Response();
  return ctx;
}

const methods = {
  add: add,
  makeName: makeName,
  animalsMakeNoise: animalsMakeNoise,
};
const options = {};

const routePost = createRoute("POST");
const routeOption = createRoute("OPTIONS")({ pathname: "*" })(return200);
const route = routePost({ pathname: "*" })(respondRpc(methods, options));
const handler = createHandler(Context)(route, routeOption)(fallBack)(
  await logger(
    resolveModuleFs("./log/access.log"),
    isDevelopment,
  ),
  enableCors({
    allowedOrigins: "*",
    allowedMethods: "POST",
    allowedHeaders: "Authorization, Content-Type",
  }),
);

await listen(handler)({ port: 8080 });
