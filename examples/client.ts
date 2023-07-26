import { makeBatchRpcCall, makeRpcCall } from "../client/mod.ts";

const call = makeRpcCall("http://localhost:8000");

const r1 = await call({ method: "animalsMakeNoise", params: ["aaa", "bbb"] });
const r2 = await call({
  method: "makeName",
  params: { firstName: "Joe", lastName: "Doe" },
});
const r3 = await call({
  method: "makeName",
  params: { firstName: "Joe", lastName: "Doe" },
}, { isNotification: true });

const batchCall = makeBatchRpcCall("http://localhost:8000");

const r4 = await batchCall([{
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, {
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, { method: "animalsMakeNoise", params: ["aaa", "bbb"] }]);
const r5 = await batchCall([{
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, {
  method: "animalsMakeNoise",
  params: ["aaa", "bbb"],
}, { method: "animalsMakeNoise", params: ["aaa", "bbb"] }], {
  isNotification: true,
});

console.log(r1);
console.log(r2);
console.log(r3);
console.log(r4);
console.log(r5);
