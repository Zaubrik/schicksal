import { respond } from "../../server/mod.ts";
import * as otherMethods from "../methods.ts";

function uploadFile(
  _params: { description: string },
  args: { blobs: Record<string, Blob> },
) {
  const fileTypes = Object.keys(args.blobs).map((key) => args.blobs[key].type);
  return { description: "File upload successful", fileTypes };
}

function uploadFiles(
  _params: { description: string },
  args: { blobs: Record<string, Blob> },
) {
  const fileNames = Object.keys(args.blobs);
  return { description: "Multiple file upload successful", fileNames };
}

const methods = {
  ...otherMethods,
  uploadFile: uploadFile,
  uploadFiles: uploadFiles,
};
const options = {
  publicErrorStack: true,
  acceptFormData: true,
  args: { text: "My name is" },
};

Deno.serve(respond(methods, options));
