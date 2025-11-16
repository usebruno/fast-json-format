const fastJsonFormat = require("../src/index");

describe("invalid JSON handling", () => {
  it("should format JSON with unquoted keys", () => {
    const input = '{name:"John",age:30}';
    const expected = `{
  name: "John",
  age: 30
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it("should handle BigInt literals", () => {
    const input = '{"bigNumber":9007199254740991n}';
    const expected = `{
  "bigNumber": 9007199254740991n
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  // Ideally, we should not have newline after the last comma
  // but for now we will keep it as it is and not introduce a performance penalty
  // to handle this case.
  it("should handle trailing commas", () => {
    const input = '{"name":"John","age":30,}';
    const expected = `{
  "name": "John",
  "age": 30,
  
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it("should handle single quotes (treating as regular characters)", () => {
    const input = "{'name':'John'}";
    const expected = `{
  'name': 'John'
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });
});
