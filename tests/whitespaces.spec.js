const { assertEqual } = require("./utils");

describe("whitespace handling", () => {
  it("should skip existing whitespace outside strings", () => {
    const input = '  {  "name"  :  "John"  ,  "age"  :  30  }  ';
    const expected = `{
  "name": "John",
  "age": 30
}`;
    assertEqual(input, expected);
  });

  it("should handle tabs and newlines in input", () => {
    const input = '{\n\t"name":\t"John",\n\t"age":\t30\n}';
    const expected = `{
  "name": "John",
  "age": 30
}`;
    assertEqual(input, expected);
  });

  it("should handle mixed whitespace characters", () => {
    const input = '{\r\n  "key"  :  \t"value"\r\n}';
    const expected = `{
  "key": "value"
}`;
    assertEqual(input, expected);
  });
});
