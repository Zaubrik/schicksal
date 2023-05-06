import { makeBatchRpcCall, makeRpcCall } from "../../client.ts";

const call = makeRpcCall("http://localhost:8000");

const r1 = await call({ method: "animalsMakeNoise", params: ["aaa", "bbb"] });
const r2 = await call({
  method: "callNamedParameters",
  params: { a: 10, b: 20, c: "ccc" },
});

const batchCall = makeBatchRpcCall("http://localhost:8000");

const r3 = await batchCall([{
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, {
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, { method: "animalsMakeNoise", params: ["aaa", "bbb"] }]);

console.log(r1);
console.log(r2);
console.log(r3);
