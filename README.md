# schicksal

JSON-RPC 2.0 library based on ES modules.

## Client

```ts
import { makeBatchRpcCall, makeRpcCall } from "../client/mod.ts";

const call = makeRpcCall("http://localhost:8000");

const r1 = await call({ method: "animalsMakeNoise", params: ["aaa", "bbb"] });
const r2 = await call({
  method: "makeName",
  params: { firstName: "Joe", lastName: "Doe" },
});

console.log(r1);
console.log(r2);

const batchCall = makeBatchRpcCall("http://localhost:8000");

const r3 = await batchCall([{
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, {
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, { method: "animalsMakeNoise", params: ["aaa", "bbb"] }]);

console.log(r3);
```

## Server

```ts
import { numberArrayValidator, respond } from "../server/mod.ts";

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
  add: { method: add, validation: numberArrayValidator },
  makeName: makeName,
  animalsMakeNoise: animalsMakeNoise,
};
const options = { args: { text: "My name is" } };

Deno.serve(respond(methods, options));
```

## Features

The server allows JWT authorization.

## Discord

Feel free to ask questions and start discussions in our
[discord server](https://discord.gg/6spYphKXAt).
