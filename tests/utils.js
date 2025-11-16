const fastJsonFormat = require("../src/index");

const assertEqual = (input, expected) => {
  expect(fastJsonFormat(input)).toBe(expected);
  expect(fastJsonFormat(input)).toBe(
    JSON.stringify(JSON.parse(input), null, 2),
  );
};

module.exports = {
  assertEqual,
};
