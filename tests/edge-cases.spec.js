const fastJsonFormat = require("../src/index");

describe("edge cases", () => {
  it("should return empty string for non-string input (undefined)", () => {
    expect(fastJsonFormat(undefined)).toBe("");
  });

  it("should return empty string for non-string input (null)", () => {
    expect(fastJsonFormat(null)).toBe("null");
    expect(fastJsonFormat(null)).toBe(JSON.stringify(JSON.parse("null")));
  });

  it("should return empty string for non-string input (number)", () => {
    expect(fastJsonFormat(123)).toBe("123");
    expect(fastJsonFormat(123)).toBe(JSON.stringify(JSON.parse("123")));
  });

  // This would throw an error if one tried JSON.parse()
  // The lib is expected to handle this gracefully and return the string as-is
  it("should return string as-is for string input", () => {
    expect(fastJsonFormat("hello")).toBe("hello");
  });

  it("should handle string with only whitespace", () => {
    expect(fastJsonFormat("   \n\t  ")).toBe("");
  });

  it("should handle unmatched brackets gracefully", () => {
    const input = '{"name":"John"';
    const expected = `{
  "name": "John"`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it("should handle extra closing brackets", () => {
    const input = '{"name":"John"}}';
    const expected = `{
  "name": "John"
}
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it("should handle strings with brackets", () => {
    const input = '{"regex":"[a-z]+"}';
    const expected = `{
  "regex": "[a-z]+"
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });

  it("should handle strings with colons and commas", () => {
    const input = '{"time":"12:30:45","list":"a,b,c"}';
    const expected = `{
  "time": "12:30:45",
  "list": "a,b,c"
}`;
    expect(fastJsonFormat(input)).toBe(expected);
  });
});
