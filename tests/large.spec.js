const { assertEqual } = require("./utils");

describe("large nested structures", () => {
  it("should handle large nested structures", () => {
    const depth = 20;
    let input = "";
    let expected = "";

    for (let i = 0; i < depth; i++) {
      input += '{"level":';
      expected += "{\n" + "  ".repeat(i + 1) + '"level": ';
    }

    input += "42";
    expected += "42";

    for (let i = depth - 1; i >= 0; i--) {
      input += "}";
      expected += "\n" + "  ".repeat(i) + "}";
    }

    assertEqual(input, expected);
  });

  it("should handle long arrays", () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const input = JSON.stringify(items);

    // Build expected output manually
    let expected = "[\n";
    for (let i = 0; i < items.length; i++) {
      expected += "  " + items[i];
      if (i < items.length - 1) {
        expected += ",\n";
      } else {
        expected += "\n";
      }
    }
    expected += "]";

    assertEqual(input, expected);
  });

  it("should handle very long strings", () => {
    const longString = "a".repeat(10000);
    const input = `{"text":"${longString}"}`;

    // Build expected output manually
    const expected = `{
  "text": "${longString}"
}`;

    assertEqual(input, expected);
  });
});
