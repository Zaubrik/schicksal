import { respond } from "../server/mod.ts";

function add([a, b]: [number, number]) {
  return a + b;
}

function makeName(
  { firstName, lastName }: { firstName: string; lastName: string },
  { text }: { text: string },
) {
  return `${text || "Hello"} ${firstName} ${lastName}`;
}

function animalsMakeNoise(noise: string[]) {
  return noise.map((el) => el.toUpperCase()).join(" ");
}

const methods = {
  add: add,
  makeName: makeName,
  animalsMakeNoise: animalsMakeNoise,
};
const options = { args: { text: "My name is" } };

Deno.serve(respond(methods, options));
