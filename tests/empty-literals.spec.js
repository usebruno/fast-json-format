const { assertEqual } = require("./utils");

describe("empty literals", () => {
  it("should format an empty object", () => {
    const input = "{}";
    const expected = "{}";
    assertEqual(input, expected);
  });

  it("should format an empty object with whitespace", () => {
    const input = `
  {
  }
  `;
    const expected = "{}";
    assertEqual(input, expected);
  });

  it("should format nested empty object with whitespace", () => {
    const input = `
  {
    "a": {
    }
  }
  `;
    const expected = `{
  "a": {}
}`;
    assertEqual(input, expected);
  });

  it("should format an empty array", () => {
    const input = "[]";
    const expected = "[]";
    assertEqual(input, expected);
  });

  it("should format nested empty array with whitespace", () => {
    const input = `
  [
    [
    ]
  ]
  `;
    const expected = `[
  []
]`;
    assertEqual(input, expected);
  });
});
