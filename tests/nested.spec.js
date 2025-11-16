const { assertEqual } = require("./utils");

describe("nested structures", () => {
  it("should format nested objects", () => {
    const input =
      '{"user":{"name":"John","address":{"city":"NYC","zip":"10001"}}}';
    const expected = `{
  "user": {
    "name": "John",
    "address": {
      "city": "NYC",
      "zip": "10001"
    }
  }
}`;
    assertEqual(input, expected);
  });

  it("should format nested arrays", () => {
    const input = "[[1,2],[3,4],[5,6]]";
    const expected = `[
  [
    1,
    2
  ],
  [
    3,
    4
  ],
  [
    5,
    6
  ]
]`;
    assertEqual(input, expected);
  });

  it("should format mixed nested structures", () => {
    const input = '{"items":[{"id":1,"name":"Item1"},{"id":2,"name":"Item2"}]}';
    const expected = `{
  "items": [
    {
      "id": 1,
      "name": "Item1"
    },
    {
      "id": 2,
      "name": "Item2"
    }
  ]
}`;
    assertEqual(input, expected);
  });

  it("should handle deeply nested structures", () => {
    const input = '{"a":{"b":{"c":{"d":{"e":"value"}}}}}';
    const expected = `{
  "a": {
    "b": {
      "c": {
        "d": {
          "e": "value"
        }
      }
    }
  }
}`;
    assertEqual(input, expected);
  });
});
