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

const batchCall = makeBatchRpcCall("http://localhost:8000");

const r3 = await batchCall([{
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, {
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, { method: "animalsMakeNoise", params: ["aaa", "bbb"] }]);
```

## Server

```ts
import { respond } from "../server/mod.ts";

function add([a, b]: [number, number]) {
  return a + b;
}

function makeName(
  { firstName, lastName }: { firstName: string; lastName: string },
  { text }: { text: string },
) {
  return `${text} ${firstName} ${lastName}`;
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
```
