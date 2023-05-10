import { makeBatchRpcCall, makeRpcCall } from "../client/mod.ts";

const call = makeRpcCall("http://localhost:8080");

const r1 = await call({ method: "animalsMakeNoise", params: ["aaa", "bbb"] });
const r2 = await call({
  method: "makeName",
  params: { firstName: "Joe", lastName: "Doe" },
});

const batchCall = makeBatchRpcCall("http://localhost:8080");

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
