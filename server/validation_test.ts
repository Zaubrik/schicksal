// deno-lint-ignore-file no-explicit-any
import { type Type } from "./deps.ts";
import { assertEquals } from "../test_deps.ts";
import {
  extractErrorPath,
  type IssueTree,
  validateInput,
  validateRequest,
} from "./validation.ts";

const methods = {
  subtract: (a: number, b: number) => a - b,
};

// Mock `Type` class for testing
class TypeMock implements Type<any> {
  constructor(public parse: (input: any) => any) {}
  nullable: any = () => this;
  toTerminals: any = () => [];
  try: any = (input: unknown) => ({ success: true, value: this.parse(input) });
  name: any = "TypeMock";
  func: any = () => this;
  optional: any = () => this;
  default: any = () => this;
  assert: any = () => this;
  map: any = () => this;
  chain: any = () => this;
}

// Test cases for `validateRequest`
Deno.test("validate request object", function (): void {
  assertEquals(
    validateRequest(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "subtract",
        params: [42, 23],
        id: 1,
      }),
      methods,
    ),
    { id: 1, method: "subtract", params: [42, 23], isError: false },
  );

  assertEquals(
    validateRequest(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "subtract",
        params: null,
        id: "abc",
      }),
      methods,
    ),
    {
      code: -32602,
      message: "Invalid params",
      id: "abc",
      isError: true,
    },
  );
});

// Test cases for `extractErrorPath`
Deno.test("extractErrorPath - simple IssueTree", () => {
  const issueTree: IssueTree = {
    ok: false,
    code: "error_code",
    expected: ["string"],
  };

  const result = extractErrorPath(issueTree);
  assertEquals(result.path, []);
});

Deno.test("extractErrorPath - nested IssueTree", () => {
  const issueTree: IssueTree = {
    ok: false,
    code: "error_code",
    expected: ["string"],
    key: "root",
    tree: {
      ok: false,
      code: "nested_error_code",
      expected: ["number"],
      key: "nested",
    },
  };

  const result = extractErrorPath(issueTree);
  assertEquals(result.path, ["root", "nested"]);
});

Deno.test("extractErrorPath - with path", () => {
  const issueTree: IssueTree = {
    ok: false,
    code: "error_code",
    expected: ["string"],
    key: "root",
    path: ["existing_path"],
    tree: {
      ok: false,
      code: "nested_error_code",
      expected: ["number"],
      key: "nested",
    },
  };

  const result = extractErrorPath(issueTree);
  assertEquals(result.path, ["existing_path", "root", "nested"]);
});

// Test cases for `validateInput`
Deno.test("validateInput - valid input", () => {
  const validation = new TypeMock((input) => input);
  const input = "valid_input";
  const validate = validateInput(validation);

  const result = validate(input);
  assertEquals(result.kind, "success");
  assertEquals(result.value, input);
});

Deno.test("validateInput - invalid input", () => {
  const validation = new TypeMock(() => {
    throw {
      issueTree: {
        ok: false,
        code: "error_code",
        expected: ["string"],
        key: "input",
      },
    };
  });
  const input = "invalid_input";
  const validate = validateInput(validation);

  const result = validate(input);
  assertEquals(result.kind, "failure");
  if (result.error) {
    assertEquals(result.error.path, ["input"]);
  } else {
    throw new Error("Expected error to be defined");
  }
});
