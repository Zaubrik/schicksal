import { makeRpcCallWithFormData } from "../../client/mod.ts";

const callWithFormData = makeRpcCallWithFormData("http://localhost:8000");

// Example 1: Uploading a single file
const file1 = new File(["file content"], "test.txt", { type: "text/plain" });
const r1 = await callWithFormData(
  { method: "uploadFile", params: { description: "Test file" } },
  { file1 },
);

console.log(r1);

// Example 2: Uploading multiple files
// const file2 = new File(["another file content"], "test2.txt", {
// type: "text/plain",
// });
// const blob = new Blob(["blob content"], { type: "text/plain" });

// const r2 = await callWithFormData(
// { method: "uploadFiles", params: { description: "Multiple files" } },
// { file1, file2, blob },
// );

// console.log(r2);
