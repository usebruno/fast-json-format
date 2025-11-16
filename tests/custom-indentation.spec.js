const fastJsonFormat = require("../src/index");

describe("custom indentation", () => {
  it("should use custom indent with 4 spaces", () => {
    const input = '{"name":"John","age":30}';
    const expected = `{
    "name": "John",
    "age": 30
}`;
    expect(fastJsonFormat(input, "    ")).toBe(expected);
    expect(fastJsonFormat(input, "    ")).toBe(
      JSON.stringify(JSON.parse(input), null, 4),
    );
  });

  it("should use single space indentation", () => {
    const input = '{"name":"John"}';
    const expected = `{
 "name": "John"
}`;
    expect(fastJsonFormat(input, " ")).toBe(expected);
    expect(fastJsonFormat(input, " ")).toBe(
      JSON.stringify(JSON.parse(input), null, 1),
    );
  });

  it("should handle custom indent with nested structures", () => {
    const input = '{"user":{"name":"John"}}';
    const expected = `{
    "user": {
        "name": "John"
    }
}`;
    expect(fastJsonFormat(input, "    ")).toBe(expected);
    expect(fastJsonFormat(input, "    ")).toBe(
      JSON.stringify(JSON.parse(input), null, 4),
    );
  });
});
